export interface ProviderCapabilities {
  text: boolean;
  images: boolean;
  video: boolean;
  carousel: boolean;
  threads: boolean;
  firstComment: boolean;
  polls: boolean;
  scheduleNative: boolean;
}

export interface ProviderLimits {
  maxChars: number;
  maxImages: number;
  maxVideoMb: number;
  maxVideoSec?: number;
}

export interface ConnectedAccount {
  accountId: string;
  accountName: string;
  avatar?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface MediaItem {
  url: string;
  mimeType: string;
  altText?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export interface PostPayload {
  text: string;
  media?: MediaItem[];
  thread?: string[];
  firstComment?: string;
  poll?: {
    options: string[];
    durationMinutes: number;
  };
  settings?: Record<string, any>;
}

export interface NormalizedPostPayload extends PostPayload {
  warnings: string[];
  originalTextLength: number;
  truncated: boolean;
}

export interface ProviderAuthContext {
  workspaceId: string;
  callbackUrl: string;
  state?: string;
  instanceUrl?: string; // For Mastodon
}

export interface ProviderCallbackContext {
  code: string;
  state: string;
  callbackUrl: string;
  instanceUrl?: string; // For Mastodon
}

export interface AnalyticsRange {
  from: Date;
  to: Date;
}

export interface ChannelAnalyticsSnapshot {
  impressions: number;
  engagements: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  followersCount?: number;
  rawMetrics?: Record<string, any>;
}

export interface SocialProvider {
  id: string; // e.g. "bluesky", "mastodon", "telegram", "discord"
  name: string;
  authType: 'oauth2' | 'oauth1' | 'credentials' | 'token';
  status: 'live' | 'coming_soon';
  capabilities: ProviderCapabilities;
  limits: ProviderLimits;

  getAuthUrl?(ctx: ProviderAuthContext): Promise<{ url: string; state: string }>;
  handleCallback?(ctx: ProviderCallbackContext): Promise<ConnectedAccount>;
  connectWithCredentials?(input: Record<string, any>): Promise<ConnectedAccount>;
  refreshToken?(account: ConnectedAccount): Promise<TokenSet>;
  validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }>;
  publish(account: ConnectedAccount, payload: NormalizedPostPayload): Promise<{ externalId: string; url?: string }>;
  deletePost?(account: ConnectedAccount, externalId: string): Promise<void>;
  fetchAnalytics?(account: ConnectedAccount, range: AnalyticsRange): Promise<ChannelAnalyticsSnapshot>;
}
