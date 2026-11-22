import { PlanTier, ChannelProvider } from '../types';

export const PLAN_LIMITS: Record<
  PlanTier,
  {
    maxChannels: number;
    maxPostsPerMonth: number;
    maxMembers: number;
    aiCredits: number;
    historyDays: number;
    whiteLabel: boolean;
  }
> = {
  [PlanTier.FREE]: {
    maxChannels: 3,
    maxPostsPerMonth: 30,
    maxMembers: 1,
    aiCredits: 20,
    historyDays: 30,
    whiteLabel: false,
  },
  [PlanTier.PRO]: {
    maxChannels: 10,
    maxPostsPerMonth: 300,
    maxMembers: 3,
    aiCredits: 200,
    historyDays: 180,
    whiteLabel: false,
  },
  [PlanTier.TEAM]: {
    maxChannels: 25,
    maxPostsPerMonth: 1000,
    maxMembers: 10,
    aiCredits: 1000,
    historyDays: 365,
    whiteLabel: true,
  },
  [PlanTier.AGENCY]: {
    maxChannels: 100,
    maxPostsPerMonth: 10000,
    maxMembers: 50,
    aiCredits: 5000,
    historyDays: 730,
    whiteLabel: true,
  },
};

export const PROVIDER_CONSTRAINTS: Record<
  ChannelProvider,
  {
    name: string;
    maxCharacters: number;
    supportsVideo: boolean;
    supportsThreads: boolean;
    supportsFirstComment: boolean;
    allowedMediaMimeTypes: string[];
  }
> = {
  [ChannelProvider.X_TWITTER]: {
    name: 'X (Twitter)',
    maxCharacters: 280,
    supportsVideo: true,
    supportsThreads: true,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
  [ChannelProvider.LINKEDIN]: {
    name: 'LinkedIn',
    maxCharacters: 3000,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: true,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'],
  },
  [ChannelProvider.INSTAGRAM]: {
    name: 'Instagram',
    maxCharacters: 2200,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: true,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.FACEBOOK]: {
    name: 'Facebook',
    maxCharacters: 63206,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: true,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.THREADS]: {
    name: 'Threads',
    maxCharacters: 500,
    supportsVideo: true,
    supportsThreads: true,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.TIKTOK]: {
    name: 'TikTok',
    maxCharacters: 2200,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['video/mp4'],
  },
  [ChannelProvider.YOUTUBE]: {
    name: 'YouTube',
    maxCharacters: 5000,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['video/mp4'],
  },
  [ChannelProvider.PINTEREST]: {
    name: 'Pinterest',
    maxCharacters: 500,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.REDDIT]: {
    name: 'Reddit',
    maxCharacters: 40000,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: true,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.BLUESKY]: {
    name: 'Bluesky',
    maxCharacters: 300,
    supportsVideo: true,
    supportsThreads: true,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.MASTODON]: {
    name: 'Mastodon',
    maxCharacters: 500,
    supportsVideo: true,
    supportsThreads: true,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.TELEGRAM]: {
    name: 'Telegram',
    maxCharacters: 4096,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.DISCORD]: {
    name: 'Discord',
    maxCharacters: 2000,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.SLACK]: {
    name: 'Slack',
    maxCharacters: 4000,
    supportsVideo: true,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  [ChannelProvider.MEDIUM]: {
    name: 'Medium',
    maxCharacters: 100000,
    supportsVideo: false,
    supportsThreads: false,
    supportsFirstComment: false,
    allowedMediaMimeTypes: ['image/jpeg', 'image/png'],
  },
};
