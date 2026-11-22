import {
  Channel,
  Post,
  CreatePostParams,
  ListPostsParams,
  PaginatedResult,
  AnalyticsOverview,
  OutboundWebhook,
  CreateWebhookParams,
} from './types';

export interface OrbitlyClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class OrbitlyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: OrbitlyClientConfig) {
    if (!config.apiKey) {
      throw new Error('Orbitly API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.orbitly.io/public/v1').replace(/\/+$/, '');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(
        `Orbitly API Error (${res.status}): ${errorJson.message || errorJson.error || res.statusText}`,
      );
    }

    return res.json() as Promise<T>;
  }

  // Channels
  async listChannels(): Promise<{ data: Channel[] }> {
    return this.request<{ data: Channel[] }>('/channels');
  }

  // Posts
  async listPosts(params?: ListPostsParams): Promise<PaginatedResult<Post>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PaginatedResult<Post>>(`/posts${qs}`);
  }

  async getPost(id: string): Promise<{ data: Post }> {
    return this.request<{ data: Post }>(`/posts/${id}`);
  }

  async createPost(params: CreatePostParams): Promise<{ data: Post }> {
    return this.request<{ data: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updatePost(id: string, params: Partial<CreatePostParams>): Promise<{ data: Post }> {
    return this.request<{ data: Post }>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deletePost(id: string): Promise<{ success: boolean; deletedId: string }> {
    return this.request<{ success: boolean; deletedId: string }>(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async publishNow(id: string): Promise<{ success: boolean; status: string }> {
    return this.request<{ success: boolean; status: string }>(`/posts/${id}/publish-now`, {
      method: 'POST',
    });
  }

  // Analytics
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return this.request<AnalyticsOverview>('/analytics/overview');
  }

  // Outbound Webhooks
  async listWebhooks(): Promise<{ data: OutboundWebhook[] }> {
    return this.request<{ data: OutboundWebhook[] }>('/webhooks');
  }

  async createWebhook(params: CreateWebhookParams): Promise<OutboundWebhook & { signingSecret: string }> {
    return this.request<OutboundWebhook & { signingSecret: string }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async deleteWebhook(id: string): Promise<{ success: boolean; deletedId: string }> {
    return this.request<{ success: boolean; deletedId: string }>(`/webhooks/${id}`, {
      method: 'DELETE',
    });
  }
}
