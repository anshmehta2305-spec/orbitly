import { ChannelProvider, PostStatus, ShareScope } from './index';

/**
 * Publicly exposed DTOs for the /share/:token client review portal.
 * STRICT SECURITY GUARANTEE:
 * Internal fields (tokenHash, passwordHash, channel tokens, team emails,
 * subscription tier, invoices, billing info, internal API keys) MUST NEVER LEAK.
 */

export interface PublicSharePortalMetaDto {
  name: string;
  scope: ShareScope;
  requiresPassword: boolean;
  expiresAt?: string | null;
  allowComments: boolean;
  allowApprove: boolean;
  brand: {
    brandName?: string | null;
    brandLogo?: string | null;
    brandColor?: string | null;
  };
}

export interface PublicShareVariantDto {
  id: string;
  channelId: string;
  provider: ChannelProvider;
  accountName: string;
  avatar?: string | null;
  content: string;
  mediaUrls: string[];
  thread: string[];
  settings?: any;
}

export interface PublicShareCommentDto {
  id: string;
  postId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  mediaUrls?: string[];
  replies?: PublicShareCommentDto[];
}

export interface PublicSharePostDto {
  id: string;
  title?: string | null;
  status: PostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  timezone: string;
  tags: string[];
  approvalVersion: number;
  variants: PublicShareVariantDto[];
  comments: PublicShareCommentDto[];
}
