import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlueskyProvider } from '../providers/bluesky';
import { MastodonProvider } from '../providers/mastodon';
import { TelegramProvider } from '../providers/telegram';
import { DiscordProvider } from '../providers/discord';

describe('Providers Integration Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================
  // 1. BLUESKY
  // ==========================================
  describe('BlueskyProvider', () => {
    const provider = new BlueskyProvider();

    it('connects with credentials and returns connected account', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          did: 'did:plc:abcdef123456',
          handle: 'sarah.bsky.social',
          accessJwt: 'jwt_access_token_123',
          refreshJwt: 'jwt_refresh_token_456',
        }),
      } as any);

      const account = await provider.connectWithCredentials({
        identifier: 'sarah.bsky.social',
        appPassword: 'xxxx-xxxx-xxxx-xxxx',
      });

      expect(account.accountId).toBe('did:plc:abcdef123456');
      expect(account.accountName).toBe('@sarah.bsky.social');
      expect(account.accessToken).toBe('jwt_access_token_123');
      expect(account.refreshToken).toBe('jwt_refresh_token_456');
    });

    it('publishes a post and returns external URI and URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          uri: 'at://did:plc:abcdef123456/app.bsky.feed.post/3kabc123def',
          cid: 'bafyreicidxyz',
        }),
      } as any);

      const account = {
        accountId: 'did:plc:abcdef123456',
        accountName: 'sarah.bsky.social',
        accessToken: 'jwt_token',
      };

      const result = await provider.publish(account, {
        text: 'Hello Bluesky from Orbitly!',
      });

      expect(result.externalId).toBe('at://did:plc:abcdef123456/app.bsky.feed.post/3kabc123def');
      expect(result.url).toContain('https://bsky.app/profile/sarah.bsky.social/post/');
    });

    it('validates account health via getSession', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ did: 'did:plc:abcdef123456', handle: 'sarah.bsky.social' }),
      } as any);

      const res = await provider.validate({
        accountId: 'did:plc:abcdef123456',
        accountName: 'sarah.bsky.social',
        accessToken: 'valid_jwt',
      });

      expect(res.ok).toBe(true);
    });

    it('reports ok: false on 401 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Token expired',
      } as any);

      const res = await provider.validate({
        accountId: 'did:plc:abcdef123456',
        accountName: 'sarah.bsky.social',
        accessToken: 'expired_jwt',
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toContain('Session token expired');
    });
  });

  // ==========================================
  // 2. MASTODON
  // ==========================================
  describe('MastodonProvider', () => {
    const provider = new MastodonProvider();

    it('validates and connects using instance and access token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '10987654321',
          username: 'sarah',
          acct: 'sarah@mastodon.social',
          avatar: 'https://mastodon.social/avatars/sarah.png',
        }),
      } as any);

      const account = await provider.connectWithCredentials({
        instanceUrl: 'https://mastodon.social',
        accessToken: 'masto_token_abc',
      });

      expect(account.accountId).toBe('10987654321');
      expect(account.accountName).toBe('@sarah@mastodon.social');
      expect(account.avatarUrl).toBe('https://mastodon.social/avatars/sarah.png');
    });

    it('publishes status with poll and returns post id', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'status_987654',
          url: 'https://mastodon.social/@sarah/987654',
        }),
      } as any);

      const result = await provider.publish(
        {
          accountId: '10987654321',
          accountName: 'sarah',
          accessToken: 'token',
          metadata: { instanceUrl: 'https://mastodon.social' },
        },
        {
          text: 'Favorite deployment platform?',
          poll: {
            options: ['Cloudflare', 'Fly.io', 'AWS'],
            durationMinutes: 1440,
          },
        },
      );

      expect(result.externalId).toBe('status_987654');
      expect(result.url).toBe('https://mastodon.social/@sarah/987654');
    });
  });

  // ==========================================
  // 3. TELEGRAM
  // ==========================================
  describe('TelegramProvider', () => {
    const provider = new TelegramProvider();

    it('validates bot token and chat permissions on connect', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            result: { id: 12345, username: 'OrbitlySchedulerBot' },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            result: { id: -1001234567, title: 'Orbitly Announcements', type: 'channel' },
          }),
        } as any);

      const account = await provider.connectWithCredentials({
        botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        chatId: '@orbitly_announcements',
      });

      expect(account.accountId).toBe('-1001234567');
      expect(account.accountName).toBe('Orbitly Announcements');
    });

    it('sends text message broadcast to channel', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            message_id: 42,
            chat: { username: 'orbitly_news' },
          },
        }),
      } as any);

      const result = await provider.publish(
        {
          accountId: '-100999',
          accountName: 'News Channel',
          accessToken: 'bot_token_secret',
          metadata: { chatId: '-100999', chatUsername: 'orbitly_news' },
        },
        { text: 'Orbitly Step 4 is live!' },
      );

      expect(result.externalId).toBe('42');
      expect(result.url).toBe('https://t.me/orbitly_news/42');
    });
  });

  // ==========================================
  // 4. DISCORD
  // ==========================================
  describe('DiscordProvider', () => {
    const provider = new DiscordProvider();

    it('validates webhook and connects account', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '123456789012345678',
          name: 'Marketing Webhook',
          channel_id: '987654321098765432',
          guild_id: '112233445566778899',
        }),
      } as any);

      const account = await provider.connectWithCredentials({
        webhookUrl: 'https://discord.com/api/webhooks/123456789012345678/token_xyz',
      });

      expect(account.accountId).toBe('123456789012345678');
      expect(account.accountName).toBe('#Marketing Webhook');
    });

    it('executes webhook with embed and returns message id', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'msg_8877665544',
          channel_id: '987654321098765432',
        }),
      } as any);

      const result = await provider.publish(
        {
          accountId: '123456',
          accountName: 'Webhook Channel',
          accessToken: 'https://discord.com/api/webhooks/123456/token',
          metadata: { guildId: 'guild_1122', channelId: 'chan_9988' },
        },
        { text: 'Major system launch notification' },
      );

      expect(result.externalId).toBe('msg_8877665544');
    });

    it('returns ok: false on 404 webhook not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Unknown Webhook',
      } as any);

      const res = await provider.validate({
        accountId: '123456',
        accountName: 'Bad Webhook',
        accessToken: 'https://discord.com/api/webhooks/bad/token',
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toContain('Discord webhook returned error');
    });
  });
});