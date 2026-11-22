import { Injectable, NotFoundException } from '@nestjs/common';
import { SocialProvider, ChannelProvider } from '@orbitly/shared';
import { BlueskyProvider } from './bluesky';
import { MastodonProvider } from './mastodon';
import { TelegramProvider } from './telegram';
import { DiscordProvider } from './discord';
import { TwitterProvider } from './twitter';
import { LinkedInProvider } from './linkedin';
import { MetaInstagramProvider, MetaFacebookProvider } from './meta';
import { ThreadsProvider } from './threads';
import { YouTubeProvider } from './youtube';
import { TikTokProvider } from './tiktok';
import { PinterestProvider } from './pinterest';
import { RedditProvider } from './reddit';
import {
  SlackProvider,
  MediumProvider,
} from './stub';

@Injectable()
export class ProviderRegistry {
  private readonly providers: Map<string, SocialProvider> = new Map();

  constructor() {
    // 1. Working providers
    this.register(new BlueskyProvider());
    this.register(new MastodonProvider());
    this.register(new TelegramProvider());
    this.register(new DiscordProvider());
    this.register(new TikTokProvider());
    this.register(new PinterestProvider());
    this.register(new RedditProvider());

    // 2. Coming soon stubs
    this.register(TwitterProvider);
    this.register(LinkedInProvider);
    this.register(MetaInstagramProvider);
    this.register(MetaFacebookProvider);
    this.register(ThreadsProvider);
    this.register(YouTubeProvider);
    this.register(SlackProvider);
    this.register(MediumProvider);
  }

  public register(provider: SocialProvider): void {
    this.providers.set(provider.id.toLowerCase(), provider);
  }

  public get(id: string): SocialProvider {
    const provider = this.providers.get(id.toLowerCase());
    if (!provider) {
      throw new NotFoundException(`Social provider plugin '${id}' is not registered in Orbitly.`);
    }
    return provider;
  }

  public getByChannelProvider(provider: ChannelProvider | string): SocialProvider {
    const mapping: Record<string, string> = {
      [ChannelProvider.BLUESKY]: 'bluesky',
      [ChannelProvider.MASTODON]: 'mastodon',
      [ChannelProvider.TELEGRAM]: 'telegram',
      [ChannelProvider.DISCORD]: 'discord',
      [ChannelProvider.X_TWITTER]: 'x_twitter',
      [ChannelProvider.LINKEDIN]: 'linkedin',
      [ChannelProvider.INSTAGRAM]: 'instagram',
      [ChannelProvider.FACEBOOK]: 'facebook',
      [ChannelProvider.THREADS]: 'threads',
      [ChannelProvider.YOUTUBE]: 'youtube',
      [ChannelProvider.TIKTOK]: 'tiktok',
      [ChannelProvider.PINTEREST]: 'pinterest',
      [ChannelProvider.REDDIT]: 'reddit',
      [ChannelProvider.SLACK]: 'slack',
      [ChannelProvider.MEDIUM]: 'medium',
    };

    const id = mapping[provider] || (typeof provider === 'string' ? provider.toLowerCase() : String(provider));
    return this.get(id);
  }

  public getAll(): SocialProvider[] {
    return Array.from(this.providers.values());
  }

  public getLiveProviders(): SocialProvider[] {
    return this.getAll().filter((p) => p.status === 'live');
  }

  public getComingSoonProviders(): SocialProvider[] {
    return this.getAll().filter((p) => p.status === 'coming_soon');
  }
}
