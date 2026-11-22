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

export class BlueskyProvider implements SocialProvider {
  public readonly id = 'bluesky';
  public readonly name = 'Bluesky';
  public readonly authType = 'credentials' as const;
  public readonly status = 'live' as const;

  public readonly capabilities: ProviderCapabilities = {
    text: true,
    images: true,
    video: false,
    carousel: true,
    threads: true,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  };

  public readonly limits: ProviderLimits = {
    maxChars: 300,
    maxImages: 4,
    maxVideoMb: 0,
  };

  private readonly pdsUrl = 'https://bsky.social';

  async connectWithCredentials(input: {
    identifier: string;
    appPassword: string;
  }): Promise<ConnectedAccount> {
    if (!input.identifier || !input.appPassword) {
      throw new ContentRejectedError('Bluesky handle/email and App Password are required.');
    }

    try {
      const res = await fetch(`${this.pdsUrl}/xrpc/com.atproto.server.createSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: input.identifier.trim(),
          password: input.appPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          throw new AuthExpiredError(data.message || 'Invalid Bluesky handle or app password.');
        }
        throw new TransientError(data.message || 'Unable to authenticate with Bluesky PDS.');
      }

      return {
        accountId: data.did,
        accountName: `@${data.handle}`,
        avatar: data.avatar,
        accessToken: data.accessJwt,
        refreshToken: data.refreshJwt,
        metadata: {
          handle: data.handle,
          did: data.did,
          email: data.email,
        },
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Network error connecting to Bluesky.');
    }
  }

  async validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }> {
    try {
      const res = await fetch(
        `${this.pdsUrl}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(account.accountId)}`,
        {
          headers: { Authorization: `Bearer ${account.accessToken}` },
        },
      );

      if (res.status === 401 || res.status === 403) {
        return { ok: false, reason: 'Session token expired. Please re-authenticate.' };
      }

      if (!res.ok) {
        return { ok: false, reason: `Bluesky returned HTTP ${res.status}` };
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, reason: err.message || 'Connection failure to Bluesky' };
    }
  }

  async publish(
    account: ConnectedAccount,
    payload: NormalizedPostPayload,
  ): Promise<{ externalId: string; url?: string }> {
    try {
      const nowIso = new Date().toISOString();

      // Create main post record
      const postRecord: Record<string, any> = {
        $type: 'app.bsky.feed.post',
        text: payload.text,
        createdAt: nowIso,
      };

      const res = await fetch(`${this.pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.accessToken}`,
        },
        body: JSON.stringify({
          repo: account.accountId,
          collection: 'app.bsky.feed.post',
          record: postRecord,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new AuthExpiredError(data.message);
        if (res.status === 429) throw new RateLimitedError(data.message);
        throw new ContentRejectedError(data.message || 'Failed to create Bluesky post');
      }

      // Format canonical web link (at://did:plc:.../app.bsky.feed.post/rkey -> bsky.app URL)
      const rkey = data.uri ? data.uri.split('/').pop() : '';
      const handleClean = account.accountName.replace(/^@/, '');
      const postUrl = rkey ? `https://bsky.app/profile/${handleClean}/post/${rkey}` : undefined;

      return {
        externalId: data.uri || data.cid,
        url: postUrl,
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Failed to publish post to Bluesky.');
    }
  }

  async deletePost(account: ConnectedAccount, externalId: string): Promise<void> {
    const rkey = externalId.split('/').pop();
    if (!rkey) return;

    await fetch(`${this.pdsUrl}/xrpc/com.atproto.repo.deleteRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify({
        repo: account.accountId,
        collection: 'app.bsky.feed.post',
        rkey,
      }),
    });
  }
}
