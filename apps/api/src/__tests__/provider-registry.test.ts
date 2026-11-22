import { describe, it, expect } from 'vitest';
import { ProviderRegistry } from '../providers/registry';
import { ChannelProvider } from '@orbitly/shared';

describe('ProviderRegistry', () => {
  const registry = new ProviderRegistry();

  it('registers all 15+ providers on initialization', () => {
    const all = registry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(15);
  });

  it('separates live providers from coming soon providers', () => {
    const live = registry.getLiveProviders();
    const comingSoon = registry.getComingSoonProviders();

    expect(live.length).toBe(7);
    const liveIds = live.map((p) => p.id).sort();
    expect(liveIds).toEqual(['bluesky', 'discord', 'mastodon', 'pinterest', 'reddit', 'telegram', 'tiktok']);

    expect(comingSoon.length).toBeGreaterThanOrEqual(8);
    for (const p of comingSoon) {
      expect(p.status).toBe('coming_soon');
    }
  });

  it('looks up provider by id case-insensitively', () => {
    const bsky = registry.get('BLUESKY');
    expect(bsky.name).toBe('Bluesky');
    expect(bsky.capabilities.text).toBe(true);
    expect(bsky.capabilities.threads).toBe(true);
    expect(bsky.limits.maxChars).toBe(300);

    const discord = registry.get('discord');
    expect(discord.name).toBe('Discord');
    expect(discord.authType).toBe('token');
  });

  it('resolves provider by Prisma ChannelProvider enum', () => {
    const provider = registry.getByChannelProvider(ChannelProvider.MASTODON);
    expect(provider.id).toBe('mastodon');
    expect(provider.capabilities.polls).toBe(true);

    const tg = registry.getByChannelProvider(ChannelProvider.TELEGRAM);
    expect(tg.id).toBe('telegram');
    expect(tg.capabilities.video).toBe(true);
  });

  it('throws NotFoundException for unregistered provider', () => {
    expect(() => registry.get('nonexistent_platform')).toThrow('not registered in Orbitly');
  });
});