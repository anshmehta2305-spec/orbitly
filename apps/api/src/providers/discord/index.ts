import {
  SocialProvider,
  ConnectedAccount,
  NormalizedPostPayload,
  ProviderLimits,
  ProviderCapabilities,
} from '@orbitly/shared';
import {
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  TransientError,
} from '@orbitly/shared';

export class DiscordProvider implements SocialProvider {
  public readonly id = 'discord';
  public readonly name = 'Discord';
  public readonly authType = 'token' as const;
  public readonly status = 'live' as const;

  public readonly capabilities: ProviderCapabilities = {
    text: true,
    images: true,
    video: false,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  };

  public readonly limits: ProviderLimits = {
    maxChars: 2000,
    maxImages: 10,
    maxVideoMb: 8,
  };

  async connectWithCredentials(input: {
    webhookUrl: string;
  }): Promise<ConnectedAccount> {
    if (!input.webhookUrl || !input.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new ContentRejectedError('Please provide a valid Discord Webhook URL (starts with https://discord.com/api/webhooks/)');
    }

    const webhookUrl = input.webhookUrl.trim();

    try {
      const res = await fetch(webhookUrl);
      const data = await res.json();

      if (!res.ok) {
        throw new AuthExpiredError(data.message || 'Discord webhook is invalid or deleted');
      }

      return {
        accountId: data.id,
        accountName: `#${data.name || 'Discord Channel'}`,
        avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : undefined,
        accessToken: webhookUrl,
        metadata: {
          channelId: data.channel_id,
          guildId: data.guild_id,
          name: data.name,
        },
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Failed connecting to Discord webhook');
    }
  }

  async validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }> {
    try {
      const res = await fetch(account.accessToken);
      if (!res.ok) return { ok: false, reason: 'Discord webhook returned error' };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, reason: err.message };
    }
  }

  async publish(
    account: ConnectedAccount,
    payload: NormalizedPostPayload,
  ): Promise<{ externalId: string; url?: string }> {
    const webhookUrl = `${account.accessToken}?wait=true`;

    try {
      const embeds = [];
      if (payload.media && payload.media.length > 0) {
        embeds.push({
          image: { url: payload.media[0].url },
        });
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: payload.text,
          embeds: embeds.length > 0 ? embeds : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) throw new AuthExpiredError('Discord webhook deleted');
        if (res.status === 429) throw new RateLimitedError('Discord webhook rate limit hit');
        throw new ContentRejectedError(data.message || 'Failed to dispatch Discord message');
      }

      return {
        externalId: data.id,
        url: undefined, // Discord webhooks don't expose public browser permalinks directly
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Failed to publish to Discord');
    }
  }

  async deletePost(account: ConnectedAccount, externalId: string): Promise<void> {
    await fetch(`${account.accessToken}/messages/${externalId}`, {
      method: 'DELETE',
    });
  }
}
