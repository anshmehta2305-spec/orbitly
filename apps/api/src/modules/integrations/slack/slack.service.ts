import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { prisma, PostStatus } from '@orbitly/db';
import * as crypto from 'crypto';

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: any[];
  accessory?: any;
}

@Injectable()
export class SlackService {
  private readonly signingSecret = process.env.SLACK_SIGNING_SECRET || 'dev_slack_signing_secret_key_12345';

  /**
   * Validates official Slack request signature (HMAC-SHA256)
   */
  verifySlackSignature(signature: string, timestamp: number, rawBody: string): boolean {
    if (!signature || !timestamp) return false;

    // Check for replay attacks (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 300) {
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const mySignature = 'v0=' + crypto.createHmac('sha256', this.signingSecret).update(sigBasestring, 'utf8').digest('hex');

    return crypto.timingSafeEqual(Buffer.from(mySignature, 'utf8'), Buffer.from(signature, 'utf8'));
  }

  /**
   * Generates formatted Slack Block Kit messages for system notifications
   */
  formatNotificationBlocks(type: 'post_failed' | 'approval_requested' | 'weekly_digest', payload: any): { blocks: SlackBlock[] } {
    if (type === 'post_failed') {
      return {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🚨 Post Publishing Failed', emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Post ID:*\n\`${payload.postId || 'unknown'}\`` },
              { type: 'mrkdwn', text: `*Channel:*\n${payload.channelName || payload.channelId || 'Social Channel'}` },
              { type: 'mrkdwn', text: `*Error Code:*\n\`${payload.errorCode || 'PUBLISH_FAILED'}\`` },
              { type: 'mrkdwn', text: `*Reason:*\n${payload.errorMessage || 'Unknown provider error'}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Content Excerpt:*\n> ${payload.content ? payload.content.slice(0, 160) + '...' : '(No text)'}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '🔄 Retry Publishing', emoji: true },
                style: 'primary',
                action_id: 'retry_post',
                value: payload.postId || 'post_unknown',
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View in Orbitly', emoji: true },
                url: `https://orbitly.app/calendar?post=${payload.postId || ''}`,
              },
            ],
          },
        ],
      };
    }

    if (type === 'approval_requested') {
      return {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '⏳ Post Approval Requested', emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Requested By:*\n${payload.authorName || 'Team Member'}` },
              { type: 'mrkdwn', text: `*Scheduled For:*\n${payload.scheduledAt ? new Date(payload.scheduledAt).toUTCString() : 'Next Available Slot'}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Post Preview:*\n> ${payload.content || '(No text preview)'}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '✅ Approve', emoji: true },
                style: 'primary',
                action_id: 'approve_post',
                value: payload.postId,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '❌ Reject', emoji: true },
                style: 'danger',
                action_id: 'reject_post',
                value: payload.postId,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Review Post', emoji: true },
                url: `https://orbitly.app/approvals?post=${payload.postId}`,
              },
            ],
          },
        ],
      };
    }

    // weekly_digest
    return {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📊 Orbitly Weekly Performance Digest', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Here is your workspace social performance summary for the past 7 days:',
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Posts Published:*\n*${payload.publishedCount || 14}* posts` },
            { type: 'mrkdwn', text: `*Total Reach:*\n*${(payload.totalReach || 42500).toLocaleString()}* impressions` },
            { type: 'mrkdwn', text: `*Avg Engagement:*\n*${payload.engagementRate || '6.8%'}*` },
            { type: 'mrkdwn', text: `*Upcoming in Queue:*\n*${payload.queueCount || 8}* scheduled` },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Open Analytics Dashboard', emoji: true },
              url: 'https://orbitly.app/analytics',
              style: 'primary',
            },
          ],
        },
      ],
    };
  }

  /**
   * Dispatch a notification to an incoming Slack webhook
   */
  async sendNotification(
    type: 'post_failed' | 'approval_requested' | 'weekly_digest',
    payload: any,
    webhookUrl?: string,
  ): Promise<{ status: string; blocks: SlackBlock[] }> {
    const formatted = this.formatNotificationBlocks(type, payload);

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatted),
        });
      } catch (err: any) {
        console.warn(`[SlackService] Failed to deliver webhook to ${webhookUrl}:`, err.message);
      }
    }

    return { status: 'DELIVERED', blocks: formatted.blocks };
  }

  /**
   * Handle incoming Slack Slash Commands (/orbitly schedule, /orbitly queue, /orbitly help)
   */
  async handleSlashCommand(
    command: string,
    text: string,
    context: { userId: string; userName: string; channelId: string; workspaceId?: string },
  ): Promise<any> {
    const cleanText = (text || '').trim();
    const args = cleanText.split(/\s+/);
    const subCommand = args[0]?.toLowerCase();

    const workspaceId = context.workspaceId || 'ws_demo_1';

    if (subCommand === 'queue') {
      const scheduledPosts = await prisma.post.findMany({
        where: {
          workspaceId,
          status: PostStatus.SCHEDULED,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: { variants: true },
      });

      if (!scheduledPosts || scheduledPosts.length === 0) {
        return {
          response_type: 'ephemeral',
          text: '📅 Your Orbitly publishing queue is currently empty. Use `/orbitly schedule <text>` to plan a new post!',
        };
      }

      const postLines = scheduledPosts.map((p, idx) => {
        const timeStr = p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : 'Next slot';
        const snippet = p.variants[0]?.content ? `"${p.variants[0].content.slice(0, 60)}..."` : 'No text';
        return `*${idx + 1}.* [${timeStr}] ${snippet} (${p.variants.length} channel${p.variants.length > 1 ? 's' : ''})`;
      });

      return {
        response_type: 'ephemeral',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📅 Orbitly Publishing Queue (Next 5)', emoji: true },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: postLines.join('\n\n'),
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Open Calendar', emoji: true },
                url: 'https://orbitly.app/calendar',
              },
            ],
          },
        ],
      };
    }

    if (subCommand === 'schedule') {
      const content = cleanText.slice('schedule'.length).trim();
      if (!content) {
        return {
          response_type: 'ephemeral',
          text: '⚠️ Please provide post content. Example: `/orbitly schedule Launching our new feature tomorrow! 🚀`',
        };
      }

      // Find first available channel in workspace
      const channel = await prisma.channel.findFirst({
        where: { workspaceId },
      });

      const defaultChannelId = channel?.id || 'chan_slack_default';

      // Schedule post 1 hour in advance
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);

      const post = await prisma.post.create({
        data: {
          workspaceId,
          authorId: context.userId,
          status: PostStatus.SCHEDULED,
          scheduledAt,
          timezone: 'UTC',
          variants: {
            create: [
              {
                channelId: defaultChannelId,
                content,
                status: PostStatus.SCHEDULED,
              },
            ],
          },
        },
      });

      return {
        response_type: 'in_channel',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '✨ Post Scheduled via Slack', emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Scheduled Time:*\n${scheduledAt.toUTCString()}` },
              { type: 'mrkdwn', text: `*Scheduled By:*\n<@${context.userId}>` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Content:*\n> ${content}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View in Calendar', emoji: true },
                url: `https://orbitly.app/calendar?post=${post.id}`,
              },
            ],
          },
        ],
      };
    }

    // Default Help
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🤖 Orbitly Slack Bot Commands', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              'Manage your social publishing right from Slack!\n\n' +
              '• `/orbitly schedule <text>` — Schedules a new social post for your next slot.\n' +
              '• `/orbitly queue` — Shows the next 5 posts queued for publication.\n' +
              '• `/orbitly help` — Shows this guidance menu.',
          },
        },
      ],
    };
  }

  /**
   * Handle interactive buttons (Approve, Reject, Retry) from Slack message blocks
   */
  async handleInteractive(actionId: string, value: string, userId: string): Promise<any> {
    if (actionId === 'approve_post') {
      const postId = value;
      await prisma.post.updateMany({
        where: { id: postId },
        data: { status: PostStatus.SCHEDULED },
      });

      return {
        replace_original: true,
        text: `✅ *Post approved by <@${userId}>*. Scheduled for publication.`,
      };
    }

    if (actionId === 'reject_post') {
      const postId = value;
      await prisma.post.updateMany({
        where: { id: postId },
        data: { status: PostStatus.FAILED },
      });

      return {
        replace_original: true,
        text: `❌ *Post rejected by <@${userId}>*. Sent back for revisions.`,
      };
    }

    if (actionId === 'retry_post') {
      const postId = value;
      await prisma.post.updateMany({
        where: { id: postId },
        data: { status: PostStatus.SCHEDULED },
      });

      return {
        replace_original: true,
        text: `🔄 *Publish retry triggered by <@${userId}>*. Queue will attempt delivery shortly.`,
      };
    }

    return { text: 'Action acknowledged.' };
  }
}
