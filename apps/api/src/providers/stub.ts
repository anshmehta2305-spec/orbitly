import {
  SocialProvider,
  ConnectedAccount,
  NormalizedPostPayload,
  ProviderLimits,
  ProviderCapabilities,
} from '@orbitly/shared';
import { ContentRejectedError } from '@orbitly/shared';

export function createStubProvider(config: {
  id: string;
  name: string;
  authType: 'oauth2' | 'oauth1' | 'credentials' | 'token';
  capabilities: ProviderCapabilities;
  limits: ProviderLimits;
  docsUrl: string;
}): SocialProvider {
  return {
    id: config.id,
    name: config.name,
    authType: config.authType,
    status: 'coming_soon',
    capabilities: config.capabilities,
    limits: config.limits,

    async validate() {
      return { ok: true };
    },

    async publish() {
      throw new ContentRejectedError(
        `${config.name} publishing is in active developer preview. Official documentation: ${config.docsUrl}`,
      );
    },
  };
}

export const TikTokProvider = createStubProvider({
  id: 'tiktok',
  name: 'TikTok',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: false,
    video: true,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: { maxChars: 2200, maxImages: 0, maxVideoMb: 500, maxVideoSec: 600 },
  docsUrl: 'https://developers.tiktok.com/doc/overview',
});

export const PinterestProvider = createStubProvider({
  id: 'pinterest',
  name: 'Pinterest',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: { maxChars: 500, maxImages: 1, maxVideoMb: 200, maxVideoSec: 900 },
  docsUrl: 'https://developers.pinterest.com/docs/api/v5/',
});

export const RedditProvider = createStubProvider({
  id: 'reddit',
  name: 'Reddit',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: { maxChars: 40000, maxImages: 1, maxVideoMb: 100 },
  docsUrl: 'https://www.reddit.com/dev/api/',
});

export const SlackProvider = createStubProvider({
  id: 'slack',
  name: 'Slack',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: false,
    carousel: false,
    threads: true,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: { maxChars: 40000, maxImages: 5, maxVideoMb: 0 },
  docsUrl: 'https://api.slack.com/',
});

export const MediumProvider = createStubProvider({
  id: 'medium',
  name: 'Medium',
  authType: 'token',
  capabilities: {
    text: true,
    images: true,
    video: false,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: { maxChars: 100000, maxImages: 10, maxVideoMb: 0 },
  docsUrl: 'https://github.com/Medium/medium-api-docs',
});
