/**
 * Platform-specific settings for TikTok, Pinterest, and Reddit
 */

export interface TikTokSettings {
  coverTimestampSec?: number;
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  allowComments?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  commercialContent?: boolean;
}

export interface PinterestSettings {
  boardId: string;
  sourceUrl?: string;
  title?: string;
  altText?: string;
}

export interface RedditSettings {
  subreddit: string;
  title?: string;
  flairId?: string;
  flairText?: string;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  sendReplies?: boolean;
}
