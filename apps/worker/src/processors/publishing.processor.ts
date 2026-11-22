import { Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma, PostStatus, ChannelStatus } from '@orbitly/db';
import {
  decryptSecret,
  normalizePayload,
  computePostStatusRollup,
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  MediaInvalidError,
  TransientError,
  FatalError,
  SocialProvider,
} from '@orbitly/shared';

// Supported rate limits per minute
const RATE_LIMITS: Record<string, number> = {
  TELEGRAM: 30,
  DISCORD: 20,
  BLUESKY: 30,
  MASTODON: 30,
  DEFAULT: 25,
};

export class PublishingProcessor {
  constructor(private readonly redis: Redis) {}

  /**
   * Token bucket rate limiter using Redis
   */
  private async checkRateLimit(provider: string, channelId: string): Promise<void> {
    const minuteBucket = Math.floor(Date.now() / 60000);
    const key = `rate:${provider}:${channelId}:${minuteBucket}`;

    const limit = RATE_LIMITS[provider] || RATE_LIMITS.DEFAULT;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 70); // 70s TTL
    }

    if (current > limit) {
      const retryAfter = 60 - (Math.floor(Date.now() / 1000) % 60);
      throw new RateLimitedError(
        `Rate limit of ${limit} posts/minute exceeded for ${provider}. Backing off for ${retryAfter}s.`,
        retryAfter,
      );
    }
  }

  /**
   * Acquire a distributed lock for variant
   */
  private async acquireLock(variantId: string): Promise<boolean> {
    const lockKey = `lock:variant:${variantId}`;
    const acquired = await this.redis.set(lockKey, 'locked', 'EX', 60, 'NX');
    return acquired === 'OK';
  }

  private async releaseLock(variantId: string): Promise<void> {
    await this.redis.del(`lock:variant:${variantId}`);
  }

  /**
   * Process a single PostVariant publication job
   */
  async processJob(job: Job): Promise<{ status: string; externalId?: string; externalUrl?: string }> {
    const { variantId, postId, workspaceId, correlationId } = job.data;
    const cid = correlationId || `cid_${Date.now()}_${variantId.slice(0, 8)}`;

    console.log(`[${cid}] 🚀 Starting publishing process for variant ${variantId} of post ${postId}`);

    // 1. Acquire distributed lock for idempotency
    const lockAcquired = await this.acquireLock(variantId);
    if (!lockAcquired) {
      console.warn(`[${cid}] ⚠️ Lock contention for variant ${variantId}. Retrying via BullMQ.`);
      throw new TransientError(`Lock contention on variant ${variantId}`);
    }

    try {
      // 2. Load variant with relations
      const variant = await prisma.postVariant.findUnique({
        where: { id: variantId },
        include: {
          channel: true,
          post: true,
        },
      });

      if (!variant) {
        throw new FatalError(`Variant ${variantId} not found in database.`);
      }

      // Idempotency check: Already published
      if (variant.status === PostStatus.PUBLISHED && variant.externalId) {
        console.log(`[${cid}] ℹ️ Variant ${variantId} already published with external ID ${variant.externalId}. Reconciling.`);
        await this.syncParentPostStatus(postId);
        return { status: 'already_published', externalId: variant.externalId, externalUrl: variant.externalUrl || undefined };
      }

      // If channel is disabled or disconnected
      if (variant.channel.status === ChannelStatus.DISABLED || variant.channel.status === ChannelStatus.DISCONNECTED) {
        throw new ContentRejectedError(`Channel ${variant.channel.accountName} is disabled or disconnected.`);
      }

      // 3. Rate limiting check
      await this.checkRateLimit(variant.channel.provider, variant.channel.id);

      // 4. Decrypt access token
      let decryptedToken: string;
      try {
        decryptedToken = decryptSecret(variant.channel.encryptedAccessToken);
      } catch (err: any) {
        throw new AuthExpiredError(`Failed to decrypt credentials for channel ${variant.channel.accountName}: ${err.message}`);
      }

      // 5. Update status to PUBLISHING
      await prisma.postVariant.update({
        where: { id: variantId },
        data: {
          status: PostStatus.PUBLISHING,
          attempts: { increment: 1 },
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { status: PostStatus.PUBLISHING },
      });

      // 6. Dispatch to Social Provider
      const result = await this.dispatchProviderPublish(variant, decryptedToken, cid);

      // 7. Success write
      await prisma.postVariant.update({
        where: { id: variantId },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          externalId: result.externalId,
          externalPostId: result.externalId,
          externalUrl: result.url,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });

      console.log(`[${cid}] ✅ Variant ${variantId} successfully published! External ID: ${result.externalId}`);

      // 8. Recompute and roll up parent Post status
      await this.syncParentPostStatus(postId);

      return {
        status: 'published',
        externalId: result.externalId,
        externalUrl: result.url,
      };
    } catch (err: any) {
      console.error(`[${cid}] ❌ Publication error on variant ${variantId}: [${err.name || 'Error'}] ${err.message}`);

      const isTransient = err instanceof TransientError || err instanceof RateLimitedError;
      const isAuthExpired = err instanceof AuthExpiredError;

      // Update variant error log
      await prisma.postVariant.update({
        where: { id: variantId },
        data: {
          status: isTransient ? PostStatus.SCHEDULED : PostStatus.FAILED,
          lastErrorCode: err.name || 'PUBLISH_ERROR',
          lastErrorMessage: err.message,
          errorMessage: err.message,
        },
      });

      // If AuthExpired, update channel status to NEEDS_REAUTH and notify
      if (isAuthExpired) {
        const variant = await prisma.postVariant.findUnique({
          where: { id: variantId },
          select: { channelId: true, channel: { select: { accountName: true } } },
        });

        if (variant) {
          await prisma.channel.update({
            where: { id: variant.channelId },
            data: { status: ChannelStatus.NEEDS_REAUTH },
          });

          await prisma.notification.create({
            data: {
              workspaceId,
              userId: job.data.userId || 'system',
              type: 'CHANNEL_AUTH_EXPIRED',
              title: `Authentication Expired: ${variant.channel.accountName}`,
              message: `Post variant could not be published because access token expired. Re-authenticate in Channel Settings.`,
              actionUrl: `/channels?reauth=${variant.channelId}`,
            },
          });
        }
      }

      await this.syncParentPostStatus(postId);

      // If transient or rate limited, rethrow so BullMQ applies exponential backoff + jitter
      if (isTransient) {
        throw err;
      }

      // Non-retryable error: create failure notification
      await prisma.notification.create({
        data: {
          workspaceId,
          userId: job.data.userId || 'system',
          type: 'POST_PUBLISH_FAILED',
          title: `Post Publication Failed`,
          message: err.message,
          actionUrl: `/calendar?post=${postId}`,
        },
      });

      return { status: 'failed', externalId: undefined };
    } finally {
      await this.releaseLock(variantId);
    }
  }

  /**
   * Dispatches publication to target provider
   */
  private async dispatchProviderPublish(
    variant: any,
    decryptedToken: string,
    cid: string,
  ): Promise<{ externalId: string; url?: string }> {
    const provider = variant.channel.provider;
    const mediaUrls = variant.mediaUrls || [];

    switch (provider) {
      case 'TELEGRAM': {
        const [botToken, chatId] = decryptedToken.split(':::');
        const targetChat = chatId || variant.channel.metadataJson?.chatId || variant.channel.accountId;

        if (mediaUrls.length > 0) {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChat,
              photo: mediaUrls[0],
              caption: variant.content,
            }),
          });
          const data = await res.json();
          if (!data.ok) throw new ContentRejectedError(data.description || 'Telegram sendPhoto failed');
          return { externalId: String(data.result.message_id) };
        } else {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChat,
              text: variant.content,
            }),
          });
          const data = await res.json();
          if (!data.ok) throw new ContentRejectedError(data.description || 'Telegram sendMessage failed');
          return { externalId: String(data.result.message_id) };
        }
      }

      case 'DISCORD': {
        const webhookUrl = `${decryptedToken}?wait=true`;
        const embeds = mediaUrls.length > 0 ? [{ image: { url: mediaUrls[0] } }] : undefined;

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: variant.content,
            embeds,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) throw new AuthExpiredError('Discord webhook deleted');
          if (res.status === 429) throw new RateLimitedError('Discord webhook rate limited');
          throw new ContentRejectedError(data.message || 'Discord dispatch failed');
        }
        return { externalId: data.id };
      }

      case 'BLUESKY': {
        const pdsUrl = 'https://bsky.social';
        const res = await fetch(`${pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decryptedToken}`,
          },
          body: JSON.stringify({
            repo: variant.channel.accountId,
            collection: 'app.bsky.feed.post',
            record: {
              $type: 'app.bsky.feed.post',
              text: variant.content,
              createdAt: new Date().toISOString(),
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) throw new AuthExpiredError('Bluesky token expired');
          throw new ContentRejectedError(data.message || 'Bluesky record creation failed');
        }

        const rkey = data.uri.split('/').pop();
        return {
          externalId: data.uri,
          url: `https://bsky.app/profile/${variant.channel.accountName.replace('@', '')}/post/${rkey}`,
        };
      }

      case 'MASTODON': {
        const instance = variant.channel.metadataJson?.instanceUrl || 'https://mastodon.social';
        const res = await fetch(`${instance}/api/v1/statuses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decryptedToken}`,
          },
          body: JSON.stringify({
            status: variant.content,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) throw new AuthExpiredError('Mastodon token expired');
          throw new ContentRejectedError(data.error || 'Mastodon publish status failed');
        }
        return {
          externalId: data.id,
          url: data.url,
        };
      }

      default: {
        // Coming soon stub simulation
        console.log(`[${cid}] ℹ️ Stub publication for provider ${provider}`);
        return {
          externalId: `stub_${provider.toLowerCase()}_${Date.now()}`,
          url: `https://${provider.toLowerCase()}.com/mock_post`,
        };
      }
    }
  }

  /**
   * Recomputes parent Post status based on all its variants
   */
  private async syncParentPostStatus(postId: string): Promise<void> {
    const variants = await prisma.postVariant.findMany({
      where: { postId },
      select: { id: true, status: true },
    });

    const newStatus = computePostStatusRollup(variants as any);
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: newStatus,
        publishedAt: newStatus === PostStatus.PUBLISHED ? new Date() : undefined,
      },
    });
  }
}
