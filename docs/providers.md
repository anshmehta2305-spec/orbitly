# Adding a New Social Provider to Orbitly

Orbitly features an extensible provider-plugin architecture. Adding a new platform requires adding **ONE** folder and registering it.

---

## 1. Provider Interface Definition (`packages/shared`)

Every provider must implement `SocialProvider`:
```typescript
export interface SocialProvider {
  id: string;                      // "bluesky", "mastodon", "threads", etc.
  name: string;
  authType: "oauth2" | "oauth1" | "credentials" | "token";
  capabilities: {
    text: boolean;
    images: boolean;
    video: boolean;
    carousel: boolean;
    threads: boolean;
    firstComment: boolean;
    polls: boolean;
    scheduleNative: boolean;
  };
  limits: {
    maxChars: number;
    maxImages: number;
    maxVideoMb: number;
    maxVideoSec?: number;
  };
  getAuthUrl?(ctx: AuthContext): Promise<{ url: string; state: string }>;
  handleCallback?(ctx: CallbackContext): Promise<ConnectedAccount>;
  connectWithCredentials?(input: CredentialsInput): Promise<ConnectedAccount>;
  refreshToken?(account: ConnectedAccount): Promise<TokenSet>;
  validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }>;
  publish(account: ConnectedAccount, payload: NormalizedPayload): Promise<{
    externalId: string;
    externalUrl?: string;
  }>;
}
```

---

## 2. Step-by-Step Implementation Guide

1. **Create the Provider Folder:**
   Under `apps/api/src/providers/`, create a new directory named after the platform (e.g. `apps/api/src/providers/bluesky/`).
2. **Implement the Class:**
   Create `bluesky.provider.ts` extending `BaseSocialProvider` and implementing `SocialProvider`.
3. **Register in Provider Registry:**
   In `apps/api/src/providers/registry.ts`, import your new provider class and instantiate it in the constructor:
   ```typescript
   this.register(new BlueskyProvider());
   ```
4. **Write Unit Tests:**
   Add tests in `apps/api/src/__tests__/providers.test.ts` verifying authentication URL generation, payload formatting, character limit enforcement, and mock publish calls.
5. **Update Platform Health Matrix:**
   Add the provider to `apps/web/src/app/[locale]/(admin)/admin/providers/page.tsx` for real-time latency monitoring and emergency kill switches.
