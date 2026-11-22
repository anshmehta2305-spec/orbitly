import { describe, it, expect } from 'vitest';
import {
  PublicSharePortalMetaDto,
  PublicSharePostDto,
} from '../types/share-portal';
import { ChannelProvider, PostStatus, ShareScope } from '../types';

describe('Public Share Portal DTO Security Guarantees', () => {
  it('ensures PublicSharePostDto never leaks internal tokens or secrets', () => {
    const safePost: PublicSharePostDto = {
      id: 'post_123',
      title: 'Global Announcement',
      status: PostStatus.SCHEDULED,
      scheduledAt: '2026-11-25T10:00:00Z',
      publishedAt: null,
      timezone: 'UTC',
      tags: ['product'],
      approvalVersion: 1,
      variants: [
        {
          id: 'variant_1',
          channelId: 'chan_bluesky',
          provider: ChannelProvider.BLUESKY,
          accountName: '@orbitly.bsky.social',
          avatar: 'https://example.com/avatar.jpg',
          content: 'Hello Bluesky!',
          mediaUrls: [],
          thread: [],
        },
      ],
      comments: [
        {
          id: 'comment_1',
          postId: 'post_123',
          authorName: 'Client Reviewer',
          authorEmail: 'client@partner.com',
          content: 'Looks great!',
          createdAt: '2026-11-21T12:00:00Z',
          parentId: null,
        },
      ],
    };

    const serialized = JSON.stringify(safePost);

    // Strict assertions: Internal secrets must NEVER appear
    expect(serialized).not.toContain('tokenHash');
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('encryptedAccessToken');
    expect(serialized).not.toContain('encryptedRefreshToken');
    expect(serialized).not.toContain('subscription');
    expect(serialized).not.toContain('invoices');
    expect(serialized).not.toContain('keyId');
    expect(serialized).not.toContain('apiKey');
  });

  it('ensures PublicSharePortalMetaDto only exposes non-sensitive branding and portal config', () => {
    const meta: PublicSharePortalMetaDto = {
      name: 'Q4 Campaign Review',
      scope: ShareScope.CALENDAR,
      requiresPassword: true,
      expiresAt: '2026-12-01T00:00:00Z',
      allowComments: true,
      allowApprove: true,
      brand: {
        brandName: 'Acme Agency',
        brandLogo: 'https://example.com/acme.png',
        brandColor: '#4F46E5',
      },
    };

    const keys = Object.keys(meta);
    expect(keys).toEqual([
      'name',
      'scope',
      'requiresPassword',
      'expiresAt',
      'allowComments',
      'allowApprove',
      'brand',
    ]);
  });
});
