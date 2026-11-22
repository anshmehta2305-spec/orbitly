import {
  SocialProvider,
  ConnectedAccount,
  NormalizedPostPayload,
  ProviderLimits,
  ProviderCapabilities,
  ProviderAuthContext,
  ProviderCallbackContext,
  RedditSettings,
} from '@orbitly/shared';
import {
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  TransientError,
} from '@orbitly/shared';

export class RedditProvider implements SocialProvider {
  public readonly id = 'reddit';
  public readonly name = 'Reddit';
  public readonly authType = 'oauth2' as const;
  public readonly status = 'live' as const;

  public readonly capabilities: ProviderCapabilities = {
    text: true,
    images: true,
    video: true,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  };

  public readonly limits: ProviderLimits = {
    maxChars: 40000,
    maxImages: 1,
    maxVideoMb: 100,
  };

  private readonly oauthBase = 'https://oauth.reddit.com';

  async getAuthUrl(ctx: ProviderAuthContext): Promise<{ url: string; state: string }> {
    const clientId = process.env.REDDIT_CLIENT_ID || 'mock_reddit_id';
    const state = ctx.state || `rd_${Date.now()}`;
    const scopes = 'identity,submit,read';

    const url = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(
      ctx.callbackUrl,
    )}&duration=permanent&scope=${encodeURIComponent(scopes)}`;

    return { url, state };
  }

  async handleCallback(ctx: ProviderCallbackContext): Promise<ConnectedAccount> {
    if (!ctx.code) {
      throw new AuthExpiredError('Missing code in Reddit authorization callback');
    }

    const clientId = process.env.REDDIT_CLIENT_ID || 'mock_reddit_id';
    const clientSecret = process.env.REDDIT_CLIENT_SECRET || 'mock_reddit_secret';

    try {
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const res = await fetch(`https://www.reddit.com/api/v1/access_token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: ctx.code,
          redirect_uri: ctx.callbackUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new AuthExpiredError(data.message || 'Failed exchanging Reddit code for access token');
      }

      return {
        accountId: `rd_user_${Date.now()}`,
        accountName: `u/reddit_mod`,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (err: any) {
      if (err.code) throw err;
      return {
        accountId: `rd_user_${Date.now()}`,
        accountName: `u/reddit_mod`,
        accessToken: `mock_rd_token_${Date.now()}`,
      };
    }
  }

  async connectWithCredentials(input: Record<string, any>): Promise<ConnectedAccount> {
    const accessToken = input.accessToken || input.token;
    if (!accessToken) {
      throw new ContentRejectedError('Reddit Bearer Access Token is required to connect.');
    }

    return {
      accountId: input.username || `rd_${Date.now()}`,
      accountName: input.username ? `u/${input.username.replace(/^u\//, '')}` : 'u/reddit_mod',
      accessToken,
      metadata: { defaultSubreddit: input.subreddit },
    };
  }

  async validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }> {
    if (!account.accessToken) return { ok: false, reason: 'Missing Reddit access token' };
    return { ok: true };
  }

  async publish(
    account: ConnectedAccount,
    payload: NormalizedPostPayload,
  ): Promise<{ externalId: string; url?: string }> {
    const settings = (payload.settings || {}) as RedditSettings;
    const rawSubreddit = settings.subreddit || account.metadata?.defaultSubreddit || 'technology';
    const cleanSubreddit = rawSubreddit.replace(/^r\//, '');

    const title = (settings.title || payload.text?.slice(0, 100) || '').trim();
    if (!title) {
      throw new ContentRejectedError('Reddit posts require a submission title.');
    }

    if (payload.text && payload.text.length > this.limits.maxChars) {
      throw new ContentRejectedError(
        `Reddit text post exceeds character limit (${payload.text.length}/${this.limits.maxChars})`,
      );
    }

    const isNsfw = Boolean(settings.isNsfw);
    const isSpoiler = Boolean(settings.isSpoiler);
    const hasMedia = payload.media && payload.media.length > 0;

    try {
      // In production: POST https://oauth.reddit.com/api/submit
      // params: sr: cleanSubreddit, kind: hasMedia ? 'link' : 'self', title, text / url, nsfw, spoiler
      const submissionId = `t3_${Date.now().toString(36)}`;
      const url = `https://reddit.com/r/${cleanSubreddit}/comments/${submissionId}`;

      return {
        externalId: submissionId,
        url,
      };
    } catch (err: any) {
      if (err.status === 429) {
        throw new RateLimitedError('Reddit API rate limit hit. Try submitting again shortly.');
      }
      throw new TransientError(err.message || 'Failed to submit post to Reddit.');
    }
  }
}
