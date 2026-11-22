import {
  SocialProvider,
  ConnectedAccount,
  NormalizedPostPayload,
  ProviderLimits,
  ProviderCapabilities,
} from '@orbitly/shared';

/**
 * Template for authoring a new SocialProvider plugin in Orbitly.
 * Follow docs/providers.md for integration steps.
 */
export class TemplateSocialProvider implements SocialProvider {
  public readonly id = 'my_custom_platform';
  public readonly name = 'My Custom Platform';
  public readonly authType = 'credentials' as const; // 'oauth2' | 'oauth1' | 'credentials' | 'token'
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
    maxChars: 1000,
    maxImages: 4,
    maxVideoMb: 10,
  };

  async validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }> {
    // Ping platform health or verify credentials endpoint
    return { ok: true };
  }

  async publish(
    account: ConnectedAccount,
    payload: NormalizedPostPayload,
  ): Promise<{ externalId: string; url?: string }> {
    // Call external REST endpoint using account.accessToken
    return {
      externalId: 'ext_12345',
      url: 'https://example.com/post/12345',
    };
  }
}
