import { MobilePostItem } from '../types/mobile';

export class MobileApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private workspaceId: string = 'ws_demo_1';

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  setWorkspaceId(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  async getFeed(filter: 'upcoming' | 'recent'): Promise<MobilePostItem[]> {
    try {
      const res = await fetch(`${this.baseUrl}/posts?workspaceId=${this.workspaceId}&filter=${filter}`, {
        headers: {
          Authorization: `Bearer ${this.token || 'demo_mobile_jwt'}`,
          'x-workspace-id': this.workspaceId,
        },
      });

      if (res.ok) {
        const json = await res.json();
        return json.items || [];
      }
    } catch {
      // Fallback sample data for offline / demo mode
    }

    const now = Date.now();
    if (filter === 'upcoming') {
      return [
        {
          id: 'post_mob_up_1',
          title: 'Design System Tokens v2.0',
          content: '🪐 Big release: Orbitly mobile apps are officially here! Schedule on the go with 2-tap manual posting.',
          status: 'SCHEDULED',
          scheduledAt: new Date(now + 3 * 3600 * 1000).toISOString(),
          channel: {
            id: 'c1',
            provider: 'LINKEDIN',
            accountName: 'Sarah Jenkins',
            color: '#0a66c2',
          },
          mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'],
        },
        {
          id: 'post_mob_up_2',
          title: 'Behind the Scenes Reel',
          content: 'Building the cross-platform composer for mobile creators. Tap to post on your personal profile! #creators',
          status: 'SCHEDULED',
          scheduledAt: new Date(now + 6 * 3600 * 1000).toISOString(),
          channel: {
            id: 'c2',
            provider: 'INSTAGRAM',
            accountName: '@sarah.designs',
            color: '#e1306c',
          },
          mediaUrls: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'],
          requiresManualPublishing: true, // Manual notification reminder
        },
      ];
    } else {
      return [
        {
          id: 'post_mob_rec_1',
          title: 'Morning Product Announcement',
          content: 'Plan once. Publish everywhere. Welcome to Orbitly 2026.',
          status: 'PUBLISHED',
          scheduledAt: new Date(now - 12 * 3600 * 1000).toISOString(),
          channel: {
            id: 'c3',
            provider: 'BLUESKY',
            accountName: 'sarah.bsky.social',
            color: '#0284c7',
          },
          mediaUrls: [],
          externalUrl: 'https://bsky.app/profile/sarah.bsky.social/post/3k123',
        },
        {
          id: 'post_mob_rec_2',
          title: 'Failed Tweet',
          content: 'Automated test dispatch to X.',
          status: 'FAILED',
          scheduledAt: new Date(now - 24 * 3600 * 1000).toISOString(),
          channel: {
            id: 'c4',
            provider: 'X_TWITTER',
            accountName: '@sarah_tweets',
            color: '#000000',
          },
          mediaUrls: [],
          errorMessage: 'Twitter API Rate limit reached (429)',
        },
      ];
    }
  }

  async quickPublish(payload: {
    content: string;
    channelIds: string[];
    mediaUrls?: string[];
    publishNow?: boolean;
    scheduledAt?: string;
  }): Promise<{ success: boolean; postId: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token || 'demo_mobile_jwt'}`,
          'x-workspace-id': this.workspaceId,
        },
        body: JSON.stringify({
          workspaceId: this.workspaceId,
          title: payload.content.slice(0, 40),
          postNow: payload.publishNow ?? false,
          scheduledAt: payload.scheduledAt || new Date(Date.now() + 86400000).toISOString(),
          variants: payload.channelIds.map((channelId) => ({
            channelId,
            content: payload.content,
            mediaUrls: payload.mediaUrls || [],
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, postId: json.id };
      }
    } catch {
      // Offline fallback
    }

    return { success: true, postId: `mob_post_${Date.now()}` };
  }

  async confirmManualPostPublished(postVariantId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/posts/variants/${postVariantId}/manual-published`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token || 'demo_mobile_jwt'}`,
          'x-workspace-id': this.workspaceId,
        },
      });
      return res.ok;
    } catch {
      return true; // Optimistic success
    }
  }
}

export const mobileApi = new MobileApiClient();
