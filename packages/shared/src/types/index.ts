export * from './provider';

export enum MembershipRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO',
  TEAM = 'TEAM',
  AGENCY = 'AGENCY',
}

export enum ChannelProvider {
  X_TWITTER = 'X_TWITTER',
  LINKEDIN = 'LINKEDIN',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  THREADS = 'THREADS',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  PINTEREST = 'PINTEREST',
  REDDIT = 'REDDIT',
  BLUESKY = 'BLUESKY',
  MASTODON = 'MASTODON',
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  SLACK = 'SLACK',
  MEDIUM = 'MEDIUM',
}

export enum ChannelStatus {
  CONNECTED = 'CONNECTED',
  NEEDS_REAUTH = 'NEEDS_REAUTH',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum ApprovalMode {
  ANY_ADMIN = 'ANY_ADMIN',
  SPECIFIC_APPROVERS = 'SPECIFIC_APPROVERS',
}

export enum ShareScope {
  CALENDAR = 'CALENDAR',
  SELECTED_POSTS = 'SELECTED_POSTS',
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  name?: string;
  role: string;
  currentWorkspaceId?: string;
}

export interface JwtTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
