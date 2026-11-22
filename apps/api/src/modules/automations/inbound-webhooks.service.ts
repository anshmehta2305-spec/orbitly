import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { prisma, PostStatus } from '@orbitly/db';
import { InboundWebhookPayload } from '@orbitly/shared';

@Injectable()
export class InboundWebhooksService {
  private hashString(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  async getEndpoints(workspaceId: string) {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true,
      },
    });

    return endpoints.map((ep) => ({
      ...ep,
      url: `http://localhost:4000/public/hooks/ep_${ep.id}`,
    }));
  }

  async createEndpoint(workspaceId: string, name = 'Default Inbound Webhook') {
    const token = 'orb_wh_tok_' + crypto.randomBytes(16).toString('hex');
    const secret = 'orb_wh_sec_' + crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hashString(token);
    const signingSecretHash = this.hashString(secret);

    const record = await prisma.webhookEndpoint.create({
      data: {
        workspaceId,
        name,
        tokenHash,
        signingSecretHash,
        isActive: true,
      },
    });

    return {
      id: record.id,
      name: record.name,
      token, // Returned ONLY on creation
      signingSecret: secret, // Returned ONLY on creation
      url: `http://localhost:4000/public/hooks/${token}`,
      createdAt: record.createdAt,
      note: 'Save this token and signing secret securely. They will not be displayed again.',
    };
  }

  async rotateSecret(workspaceId: string, id: string) {
    const ep = await prisma.webhookEndpoint.findFirst({
      where: { id, workspaceId },
    });
    if (!ep) throw new NotFoundException('Webhook endpoint not found');

    const newSecret = 'orb_wh_sec_' + crypto.randomBytes(24).toString('hex');
    const signingSecretHash = this.hashString(newSecret);

    await prisma.webhookEndpoint.update({
      where: { id },
      data: { signingSecretHash },
    });

    return {
      id: ep.id,
      name: ep.name,
      newSigningSecret: newSecret,
      message: 'Signing secret rotated successfully.',
    };
  }

  async deleteEndpoint(workspaceId: string, id: string) {
    const ep = await prisma.webhookEndpoint.findFirst({
      where: { id, workspaceId },
    });
    if (!ep) throw new NotFoundException('Webhook endpoint not found');

    return prisma.webhookEndpoint.delete({ where: { id } });
  }

  async handleInbound(
    token: string,
    signature: string | undefined,
    timestamp: string | undefined,
    rawPayload: string,
    payload: InboundWebhookPayload,
  ) {
    const tokenHash = this.hashString(token);
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { tokenHash },
    });

    if (!endpoint || !endpoint.isActive) {
      throw new NotFoundException('Invalid or inactive webhook endpoint');
    }

    // Verify replay window if timestamp header provided
    if (timestamp) {
      const ts = Number(timestamp);
      const now = Math.floor(Date.now() / 1000);
      if (isNaN(ts) || Math.abs(now - ts) > 300) {
        throw new UnauthorizedException('Webhook timestamp outside acceptable 5-minute replay window');
      }
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: endpoint.workspaceId },
      include: {
        settings: true,
        channels: { select: { id: true, provider: true } },
        memberships: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    });

    if (!workspace) throw new NotFoundException('Associated workspace not found');

    const authorId = workspace.memberships[0]?.userId || 'system_author';

    // Check workspace approval settings
    const approvalRequired = workspace.settings?.approvalRequired ?? false;
    let initialStatus: PostStatus = PostStatus.DRAFT;

    if (approvalRequired) {
      initialStatus = PostStatus.PENDING_APPROVAL;
    } else if (payload.scheduledAt) {
      initialStatus = PostStatus.SCHEDULED;
    }

    const scheduledDate = payload.scheduledAt ? new Date(payload.scheduledAt) : new Date(Date.now() + 3600000);

    // Resolve channel IDs
    const channelIds = payload.channelIds && payload.channelIds.length > 0
      ? payload.channelIds
      : workspace.channels.map((c) => c.id);

    if (channelIds.length === 0) {
      throw new BadRequestException('No channels specified or connected in workspace');
    }

    // Create Post + Variants
    const post = await prisma.post.create({
      data: {
        workspaceId: workspace.id,
        authorId,
        status: initialStatus,
        scheduledAt: scheduledDate,
        timezone: 'UTC',
        variants: {
          create: channelIds.map((cId: string) => ({
            channelId: cId,
            content: payload.content,
            media: payload.mediaUrls || [],
            thread: [],
            status: initialStatus,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    // Update endpoint lastUsedAt
    await prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      success: true,
      postId: post.id,
      status: post.status,
      variantsCreated: post.variants.length,
      scheduledAt: post.scheduledAt,
      approvalRequired,
    };
  }
}
