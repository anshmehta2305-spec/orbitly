import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TikTokProvider } from '../providers/tiktok';
import { PinterestProvider } from '../providers/pinterest';
import { RedditProvider } from '../providers/reddit';
import { ContentRejectedError } from '@orbitly/shared';

describe('Increment 2 Platform Providers: TikTok, Pinterest, Reddit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. TIKTOK
  // ==========================================
  describe('TikTokProvider', () => {
    const provider = new TikTokProvider();

    it('has correct capabilities and limits', () => {
      expect(provider.id).toBe('tiktok');
      expect(provider.status).toBe('live');
      expect(provider.capabilities.video).toBe(true);
      expect(provider.capabilities.images).toBe(false);
      expect(provider.limits.maxChars).toBe(2200);
      expect(provider.limits.maxVideoMb).toBe(500);
      expect(provider.limits.maxVideoSec).toBe(600);
    });

    it('generates valid OAuth2 authorization URL with required scopes', async () => {
      const auth = await provider.getAuthUrl({
        workspaceId: 'ws_1',
        callbackUrl: 'https://orbitly.app/api/channels/tiktok/callback',
      });
      expect(auth.url).toContain('https://www.tiktok.com/v2/auth/authorize/');
      expect(auth.url).toContain('video.upload');
      expect(auth.url).toContain('video.publish');
    });

    it('rejects publishing when no video file is provided', async () => {
      const account = {
        accountId: 'tk_123',
        accountName: '@orbitly_tiktok',
        accessToken: 'tk_token',
      };

      await expect(
        provider.publish(account, {
          text: 'Short-form launch video!',
          media: [], // No video
          warnings: [],
          originalTextLength: 25,
          truncated: false,
        }),
      ).rejects.toThrow(ContentRejectedError);
    });

    it('publishes video post with cover timestamp and returns external URL', async () => {
      const account = {
        accountId: 'tk_123',
        accountName: '@orbitly_tiktok',
        accessToken: 'tk_token',
      };

      const result = await provider.publish(account, {
        text: 'Excited to showcase our product release on TikTok!',
        media: [{ url: 'https://cdn.orbitly.app/videos/clip1.mp4', mimeType: 'video/mp4' }],
        settings: {
          coverTimestampSec: 3,
          privacyLevel: 'PUBLIC_TO_EVERYONE',
        },
        warnings: [],
        originalTextLength: 50,
        truncated: false,
      });

      expect(result.externalId).toBeDefined();
      expect(result.url).toContain('tiktok.com/@orbitly_tiktok/video/');
    });
  });

  // ==========================================
  // 2. PINTEREST
  // ==========================================
  describe('PinterestProvider', () => {
    const provider = new PinterestProvider();

    it('has correct capabilities and limits', () => {
      expect(provider.id).toBe('pinterest');
      expect(provider.status).toBe('live');
      expect(provider.capabilities.images).toBe(true);
      expect(provider.capabilities.video).toBe(true);
      expect(provider.limits.maxChars).toBe(500);
      expect(provider.limits.maxImages).toBe(1);
    });

    it('rejects publishing without media attachment', async () => {
      const account = {
        accountId: 'pin_123',
        accountName: 'Orbitly Design',
        accessToken: 'pin_token',
      };

      await expect(
        provider.publish(account, {
          text: 'A text-only post cannot be pinned.',
          media: [],
          warnings: [],
          originalTextLength: 30,
          truncated: false,
        }),
      ).rejects.toThrow(ContentRejectedError);
    });

    it('publishes pin with boardId and destination sourceUrl', async () => {
      const account = {
        accountId: 'pin_123',
        accountName: 'Orbitly Design',
        accessToken: 'pin_token',
      };

      const result = await provider.publish(account, {
        text: 'Minimalist dashboard inspirations and workspace styling tips.',
        media: [{ url: 'https://images.unsplash.com/photo-1.jpg', mimeType: 'image/jpeg' }],
        settings: {
          boardId: 'board_branding_99',
          title: 'Clean Minimal SaaS UI',
          sourceUrl: 'https://orbitly.io/blog/design-tokens',
        },
        warnings: [],
        originalTextLength: 60,
        truncated: false,
      });

      expect(result.externalId).toBeDefined();
      expect(result.url).toContain('pinterest.com/pin/');
    });

    it('fetches available boards for the connected account', async () => {
      const account = {
        accountId: 'pin_123',
        accountName: 'Orbitly Design',
        accessToken: 'pin_token',
      };

      const boards = await provider.fetchBoards(account);
      expect(boards.length).toBeGreaterThan(0);
      expect(boards[0].id).toBeDefined();
      expect(boards[0].name).toBeDefined();
    });
  });

  // ==========================================
  // 3. REDDIT
  // ==========================================
  describe('RedditProvider', () => {
    const provider = new RedditProvider();

    it('has correct capabilities and limits', () => {
      expect(provider.id).toBe('reddit');
      expect(provider.status).toBe('live');
      expect(provider.limits.maxChars).toBe(40000);
    });

    it('rejects submission when title is missing or empty', async () => {
      const account = {
        accountId: 'rd_123',
        accountName: 'u/orbitly_dev',
        accessToken: 'rd_token',
      };

      await expect(
        provider.publish(account, {
          text: '', // No text and no title
          media: [],
          settings: { title: '', subreddit: 'webdev' },
          warnings: [],
          originalTextLength: 0,
          truncated: false,
        }),
      ).rejects.toThrow(ContentRejectedError);
    });

    it('submits Reddit post with subreddit, title, and NSFW/Spoiler flags', async () => {
      const account = {
        accountId: 'rd_123',
        accountName: 'u/orbitly_dev',
        accessToken: 'rd_token',
      };

      const result = await provider.publish(account, {
        text: 'We spent 6 months building an open social publishing engine with NestJS and Next.js 15. Ask us anything!',
        media: [],
        settings: {
          subreddit: 'r/webdev',
          title: 'Show Reddit: Orbitly — Plan once. Publish everywhere.',
          isNsfw: false,
          isSpoiler: false,
          flairText: 'Showcase',
        },
        warnings: [],
        originalTextLength: 100,
        truncated: false,
      });

      expect(result.externalId).toBeDefined();
      expect(result.url).toContain('reddit.com/r/webdev/comments/');
    });
  });
});
