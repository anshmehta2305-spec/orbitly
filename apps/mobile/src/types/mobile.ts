import { ChannelProvider, PostStatus } from '@orbitly/shared';

export interface MobilePostItem {
  id: string;
  title: string;
  content: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PENDING_APPROVAL';
  scheduledAt: string;
  channel: {
    id: string;
    provider: ChannelProvider | string;
    accountName: string;
    color: string;
  };
  mediaUrls: string[];
  requiresManualPublishing?: boolean; // True for personal Instagram/TikTok accounts
  externalUrl?: string;
  errorMessage?: string;
}

export type PushNotificationType =
  | 'POST_PUBLISHED'
  | 'APPROVAL_REQUESTED'
  | 'POST_FAILED'
  | 'MANUAL_POST_REMINDER';

export interface PushNotificationPayload {
  type: PushNotificationType;
  title: string;
  body: string;
  data: {
    postId?: string;
    postVariantId?: string;
    workspaceId?: string;
    channelName?: string;
    platform?: 'INSTAGRAM' | 'TIKTOK' | string;
    caption?: string;
    mediaUrl?: string;
    errorReason?: string;
  };
}

export interface ManualPostReminder {
  postVariantId: string;
  platform: 'INSTAGRAM' | 'TIKTOK';
  accountHandle: string;
  caption: string;
  mediaUrl: string;
  scheduledAt: string;
}
