import {
  SocialProvider,
  ConnectedAccount,
  NormalizedPostPayload,
  ProviderLimits,
  ProviderCapabilities,
  ProviderAuthContext,
  ProviderCallbackContext,
} from '@orbitly/shared';
import {
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  TransientError,
} from '@orbitly/shared';

export class MastodonProvider implements SocialProvider {
  public readonly id = 'mastodon';
  public readonly name = 'Mastodon';
  public readonly authType = 'oauth2' as const;
  public readonly status = 'live' as const;

  public readonly capabilities: ProviderCapabilities = {
    text: true,
    images: true,
    video: true,
    carousel: true,
    threads: true,
    firstComment: false,
    polls: true,
    scheduleNative: true,
  };

  public readonly limits: ProviderLimits = {
    maxChars: 500,
    maxImages: 4,
    maxVideoMb: 40,
  };

  private normalizeInstanceUrl(url: string): string {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean.replace(/\/+$/, '');
  }

  async getAuthUrl(ctx: ProviderAuthContext): Promise<{ url: string; state: string }> {
    const instance = this.normalizeInstanceUrl(ctx.instanceUrl || 'https://mastodon.social');
    const state = ctx.state || Math.random().toString(36).substring(2, 15);

    try {
      // 1. Dynamic client app registration on target instance
      const appRes = await fetch(`${instance}/api/v1/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Orbitly Social',
          redirect_uris: ctx.callbackUrl,
          scopes: 'read write follow',
          website: 'https://orbitly.app',
        }),
      });

      const appData = await appRes.json();
      if (!appRes.ok) {
        throw new ContentRejectedError(`Failed to register client app with instance ${instance}: ${appData.error}`);
      }

      // Build OAuth authorize redirect URL
      const params = new URLSearchParams({
        client_id: appData.client_id,
        response_type: 'code',
        redirect_uri: ctx.callbackUrl,
        scope: 'read write follow',
        state: `${state}__${encodeURIComponent(instance)}__${encodeURIComponent(appData.client_secret)}`,
      });

      return {
        url: `${instance}/oauth/authorize?${params.toString()}`,
        state,
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Unable to contact Mastodon instance');
    }
  }

  async handleCallback(ctx: ProviderCallbackContext): Promise<ConnectedAccount> {
    const [originalState, instanceEncoded, clientSecretEncoded] = ctx.state.split('__');
    const instance = decodeURIComponent(instanceEncoded || 'https://mastodon.social');
    const clientSecret = decodeURIComponent(clientSecretEncoded || '');

    const res = await fetch(`${instance}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: ctx.code,
        client_secret: clientSecret,
        redirect_uri: ctx.callbackUrl,
        scope: 'read write follow',
      }),
    });

    const tokenData = await res.json();
    if (!res.ok) {
      throw new AuthExpiredError(tokenData.error_description || 'Failed to exchange Mastodon code for token');
    }

    // Verify credentials & fetch account handle
    const accountRes = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const accountData = await accountRes.json();

    return {
      accountId: accountData.id,
      accountName: `@${accountData.acct}@${new URL(instance).hostname}`,
      avatarUrl: accountData.avatar,
      accessToken: tokenData.access_token,
      metadata: {
        instanceUrl: instance,
        username: accountData.username,
        url: accountData.url,
      },
    };
  }

  async connectWithCredentials(input: {
    instanceUrl: string;
    accessToken: string;
  }): Promise<ConnectedAccount> {
    const instance = this.normalizeInstanceUrl(input.instanceUrl || 'https://mastodon.social');
    const token = input.accessToken.trim();

    try {
      const res = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new AuthExpiredError(data.error || 'Invalid Mastodon access token or instance');
      }

      return {
        accountId: data.id,
        accountName: `@${data.username}@${new URL(instance).hostname}`,
        avatarUrl: data.avatar,
        accessToken: token,
        metadata: {
          instanceUrl: instance,
          url: data.url,
        },
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Failed connecting to Mastodon');
    }
  }

  async validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }> {
    const instance = account.metadata?.instanceUrl || 'https://mastodon.social';
    try {
      const res = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
        headers: { Authorization: `Bearer ${account.accessToken}` },
      });

      if (!res.ok) return { ok: false, reason: 'Token verification failed' };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, reason: err.message };
    }
  }

  async publish(
    account: ConnectedAccount,
    payload: NormalizedPostPayload,
  ): Promise<{ externalId: string; url?: string }> {
    const instance = account.metadata?.instanceUrl || 'https://mastodon.social';

    try {
      const body: Record<string, any> = {
        status: payload.text,
      };

      if (payload.poll) {
        body.poll = {
          options: payload.poll.options,
          expires_in: payload.poll.durationMinutes * 60,
        };
      }

      const res = await fetch(`${instance}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new AuthExpiredError(data.error);
        if (res.status === 429) throw new RateLimitedError(data.error);
        throw new ContentRejectedError(data.error || 'Failed to publish Mastodon status');
      }

      return {
        externalId: data.id,
        url: data.url,
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Failed to publish to Mastodon');
    }
  }

  async deletePost(account: ConnectedAccount, externalId: string): Promise<void> {
    const instance = account.metadata?.instanceUrl || 'https://mastodon.social';
    await fetch(`${instance}/api/v1/statuses/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });
  }
}
