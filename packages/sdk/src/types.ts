export interface Channel {
  id: string;
  provider: string;
  accountName: string;
  avatar: string | null;
  status: string;
  createdAt: string;
}

export interface PostVariant {
  id: string;
  channelId: string;
  content: string;
  mediaUrls: string[];
  status: string;
  publishedAt: string | null;
  externalUrl: string | null;
}

export interface Post {
  id: string;
  workspaceId: string;
  authorId: string;
  status: string;
  scheduledAt: string;
  timezone: string;
  variants: PostVariant[];
  createdAt: string;
}

export interface CreatePostParams {
  channelIds: string[];
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  timezone?: string;
  idempotencyKey?: string;
}

export interface ListPostsParams {
  limit?: number;
  cursor?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface AnalyticsOverview {
  workspaceId: string;
  period: string;
  kpis: {
    followers: number;
    impressions: number;
    engagements: number;
    avgEngagementRate: string;
  };
}

export interface OutboundWebhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  failureCount: number;
  lastDeliveryAt: string | null;
  createdAt: string;
}

export interface CreateWebhookParams {
  url: string;
  events: ('post.scheduled' | 'post.published' | 'post.failed' | 'post.approved' | 'channel.needs_reauth')[];
}
