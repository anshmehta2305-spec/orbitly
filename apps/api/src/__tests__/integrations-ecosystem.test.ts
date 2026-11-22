import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlackService } from '../modules/integrations/slack/slack.service';
import { ZapierApp } from '../../../../packages/integrations/zapier/index';
import makeModules from '../../../../packages/integrations/make/modules.json';
import { prisma, PostStatus } from '@orbitly/db';
import * as crypto from 'crypto';

vi.mock('@orbitly/db', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    channel: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    outboundWebhook: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
  PostStatus: {
    DRAFT: 'DRAFT',
    SCHEDULED: 'SCHEDULED',
    PUBLISHED: 'PUBLISHED',
    FAILED: 'FAILED',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
  },
}));

describe('Increment 5: Integrations Ecosystem (Zapier, Make, Slack Bot)', () => {
  let slackService: SlackService;

  beforeEach(() => {
    vi.clearAllMocks();
    slackService = new SlackService();
  });

  describe('1. Zapier App CLI Definition', () => {
    it('should have valid Zapier authentication configuration', () => {
      expect(ZapierApp.authentication.type).toBe('custom');
      expect(ZapierApp.authentication.fields).toHaveLength(1);
      expect(ZapierApp.authentication.fields[0].key).toBe('apiKey');
    });

    it('should define triggers for post_published and post_failed with webhook hooks', () => {
      expect(ZapierApp.triggers.new_post_published).toBeDefined();
      expect(ZapierApp.triggers.new_post_published.operation.type).toBe('hook');
      expect(ZapierApp.triggers.post_failed).toBeDefined();
      expect(ZapierApp.triggers.post_failed.operation.type).toBe('hook');
    });

    it('should define actions for create_post and upload_media with expected inputs', () => {
      expect(ZapierApp.creates.create_post).toBeDefined();
      const createPostInputs = ZapierApp.creates.create_post.operation.inputFields.map((f: any) => f.key);
      expect(createPostInputs).toContain('content');
      expect(createPostInputs).toContain('channelIds');

      expect(ZapierApp.creates.upload_media).toBeDefined();
      const uploadInputs = ZapierApp.creates.upload_media.operation.inputFields.map((f: any) => f.key);
      expect(uploadInputs).toContain('fileName');
    });

    it('should perform create_post action calling the Orbitly public API', async () => {
      const mockZ = {
        request: vi.fn().mockResolvedValue({
          data: {
            data: { id: 'post_zap_123', status: 'SCHEDULED' },
          },
        }),
      } as any;

      const mockBundle = {
        authData: { apiKey: 'orb_live_test_key_1' },
        inputData: {
          content: 'Hello from Zapier automation! 🤖',
          channelIds: ['chan_1', 'chan_2'],
          scheduledAt: '2026-11-25T15:00:00Z',
          mediaUrls: ['https://cdn.example.com/zap.png'],
        },
      } as any;

      const result = await ZapierApp.creates.create_post.operation.perform(mockZ, mockBundle);

      expect(mockZ.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.orbitly.io/public/v1/posts',
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer orb_live_test_key_1',
          }),
          body: expect.objectContaining({
            content: 'Hello from Zapier automation! 🤖',
            channelIds: ['chan_1', 'chan_2'],
          }),
        }),
      );
      expect(result.id).toBe('post_zap_123');
    });
  });

  describe('2. Make (Integromat) App Definition', () => {
    it('should define triggers and actions matching the required specification', () => {
      const moduleNames = makeModules.modules.map((m: any) => m.name);
      expect(moduleNames).toContain('watchPostsPublished');
      expect(moduleNames).toContain('watchPostsFailed');
      expect(moduleNames).toContain('createPost');
      expect(moduleNames).toContain('uploadMedia');
      expect(moduleNames).toContain('listChannels');
    });

    it('watchPostsPublished webhook should subscribe to post.published event', () => {
      const trigger = makeModules.modules.find((m: any) => m.name === 'watchPostsPublished') as any;
      expect(trigger.webhook.subscribe.body.events).toContain('post.published');
      expect(trigger.webhook.subscribe.url).toContain('/public/v1/webhooks');
    });

    it('createPost action should map parameters to public API POST /public/v1/posts', () => {
      const action = makeModules.modules.find((m: any) => m.name === 'createPost') as any;
      expect(action.communication.method).toBe('POST');
      expect(action.communication.url).toContain('/public/v1/posts');
      const paramNames = action.parameters.map((p: any) => p.name);
      expect(paramNames).toContain('content');
      expect(paramNames).toContain('channelIds');
    });
  });

  describe('3. Slack Bot Service - Signatures, Notifications & Commands', () => {
    it('should verify authentic Slack HMAC-SHA256 request signatures', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const rawBody = 'command=%2Forbitly&text=queue';
      const secret = 'dev_slack_signing_secret_key_12345';
      const sigBasestring = `v0:${timestamp}:${rawBody}`;
      const hash = crypto.createHmac('sha256', secret).update(sigBasestring, 'utf8').digest('hex');
      const validSignature = `v0=${hash}`;

      const verified = slackService.verifySlackSignature(validSignature, timestamp, rawBody);
      expect(verified).toBe(true);
    });

    it('should reject requests with expired timestamp (replay protection)', () => {
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago (> 5m)
      const rawBody = 'command=%2Forbitly&text=queue';
      const secret = 'dev_slack_signing_secret_key_12345';
      const sigBasestring = `v0:${expiredTimestamp}:${rawBody}`;
      const hash = crypto.createHmac('sha256', secret).update(sigBasestring, 'utf8').digest('hex');
      const signature = `v0=${hash}`;

      const verified = slackService.verifySlackSignature(signature, expiredTimestamp, rawBody);
      expect(verified).toBe(false);
    });

    it('should format post_failed Block Kit notification with retry action button', () => {
      const notification = slackService.formatNotificationBlocks('post_failed', {
        postId: 'post_failed_99',
        channelName: 'Twitter @orbitly_app',
        errorCode: 'TOKEN_EXPIRED',
        errorMessage: 'OAuth token has been revoked by user.',
        content: 'Launching our new website today! Check it out.',
      });

      expect(notification.blocks).toBeDefined();
      const header = notification.blocks.find((b) => b.type === 'header');
      expect(header?.text?.text).toContain('Post Publishing Failed');

      const actionBlock = notification.blocks.find((b) => b.type === 'actions');
      const retryBtn = actionBlock?.elements?.find((el: any) => el.action_id === 'retry_post');
      expect(retryBtn).toBeDefined();
      expect(retryBtn.value).toBe('post_failed_99');
    });

    it('should format approval_requested Block Kit notification with Approve & Reject buttons', () => {
      const notification = slackService.formatNotificationBlocks('approval_requested', {
        postId: 'post_appr_101',
        authorName: 'Sarah Jenkins',
        content: 'Exclusive 20% discount code for our followers: ORBIT20',
        scheduledAt: '2026-11-25T18:00:00Z',
      });

      const actionBlock = notification.blocks.find((b) => b.type === 'actions');
      const approveBtn = actionBlock?.elements?.find((el: any) => el.action_id === 'approve_post');
      const rejectBtn = actionBlock?.elements?.find((el: any) => el.action_id === 'reject_post');

      expect(approveBtn).toBeDefined();
      expect(approveBtn.style).toBe('primary');
      expect(rejectBtn).toBeDefined();
      expect(rejectBtn.style).toBe('danger');
    });

    it('should format weekly_digest Block Kit notification with performance metrics', () => {
      const notification = slackService.formatNotificationBlocks('weekly_digest', {
        publishedCount: 18,
        totalReach: 52000,
        engagementRate: '8.4%',
        queueCount: 6,
      });

      const header = notification.blocks.find((b) => b.type === 'header');
      expect(header?.text?.text).toContain('Weekly Performance Digest');
    });

    it('should handle /orbitly queue slash command returning upcoming scheduled posts', async () => {
      (prisma.post.findMany as any).mockResolvedValue([
        {
          id: 'p1',
          scheduledAt: new Date('2026-11-22T10:00:00Z'),
          variants: [{ content: 'Upcoming post teaser #1' }],
        },
        {
          id: 'p2',
          scheduledAt: new Date('2026-11-22T14:00:00Z'),
          variants: [{ content: 'Upcoming post teaser #2' }],
        },
      ]);

      const response = await slackService.handleSlashCommand('/orbitly', 'queue', {
        userId: 'U_TEST',
        userName: 'tester',
        channelId: 'C_DEV',
      });

      expect(response.blocks).toBeDefined();
      const header = response.blocks.find((b: any) => b.type === 'header');
      expect(header.text.text).toContain('Orbitly Publishing Queue');
      expect(prisma.post.findMany).toHaveBeenCalled();
    });

    it('should handle /orbitly schedule <text> slash command and create scheduled post', async () => {
      (prisma.channel.findFirst as any).mockResolvedValue({ id: 'chan_tw_1' });
      (prisma.post.create as any).mockResolvedValue({ id: 'post_slack_new_1' });

      const response = await slackService.handleSlashCommand(
        '/orbitly',
        'schedule Special Black Friday sale goes live at midnight! 🛍️',
        {
          userId: 'U_ALICE',
          userName: 'Alice',
          channelId: 'C_MARKETING',
        },
      );

      expect(response.blocks).toBeDefined();
      const header = response.blocks.find((b: any) => b.type === 'header');
      expect(header.text.text).toContain('Post Scheduled via Slack');
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PostStatus.SCHEDULED,
          }),
        }),
      );
    });

    it('should handle interactive button click for post approval', async () => {
      const response = await slackService.handleInteractive('approve_post', 'post_100', 'U_REVIEWER');
      expect(response.replace_original).toBe(true);
      expect(response.text).toContain('approved by <@U_REVIEWER>');
      expect(prisma.post.updateMany).toHaveBeenCalledWith({
        where: { id: 'post_100' },
        data: { status: PostStatus.SCHEDULED },
      });
    });

    it('should handle interactive button click for post rejection', async () => {
      const response = await slackService.handleInteractive('reject_post', 'post_101', 'U_REVIEWER');
      expect(response.replace_original).toBe(true);
      expect(response.text).toContain('rejected by <@U_REVIEWER>');
      expect(prisma.post.updateMany).toHaveBeenCalledWith({
        where: { id: 'post_101' },
        data: { status: PostStatus.FAILED },
      });
    });
  });
});
