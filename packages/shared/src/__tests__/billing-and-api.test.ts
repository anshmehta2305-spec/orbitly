import { describe, it, expect } from 'vitest';
import { can, checkLimit, isGracePeriodActive, shouldDowngradeToFree } from '../services/entitlements';
import { PlanTier } from '../types';
import { generateApiKey, hashApiKey, hasScope } from '../security/api-key';
import { signOutboundWebhook, verifyOutboundWebhook } from '../security/webhook-signing';

describe('Entitlements & Limits Single Source of Truth', () => {
  it('enforces feature permissions by plan tier', () => {
    expect(can(PlanTier.FREE, 'white_label')).toBe(false);
    expect(can(PlanTier.PRO, 'white_label')).toBe(false);
    expect(can(PlanTier.TEAM, 'white_label')).toBe(true);
    expect(can(PlanTier.AGENCY, 'white_label')).toBe(true);

    expect(can(PlanTier.FREE, 'public_api')).toBe(false);
    expect(can(PlanTier.PRO, 'public_api')).toBe(true);
  });

  it('accurately computes numeric limits and remaining quota', () => {
    // Free plan: 3 channels
    const freeChannels = checkLimit(2, PlanTier.FREE, 'channels');
    expect(freeChannels.allowed).toBe(true);
    expect(freeChannels.remaining).toBe(1);

    const freeChannelsExceeded = checkLimit(3, PlanTier.FREE, 'channels');
    expect(freeChannelsExceeded.allowed).toBe(false);
    expect(freeChannelsExceeded.remaining).toBe(0);

    // Agency plan: 100 channels
    const agencyChannels = checkLimit(45, PlanTier.AGENCY, 'channels');
    expect(agencyChannels.allowed).toBe(true);
    expect(agencyChannels.limit).toBe(100);
    expect(agencyChannels.remaining).toBe(55);
  });

  it('manages 7-day grace period on PAST_DUE before downgrading to FREE', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    expect(isGracePeriodActive(threeDaysAgo, 7)).toBe(true);
    expect(shouldDowngradeToFree('PAST_DUE', threeDaysAgo)).toBe(false);

    expect(isGracePeriodActive(tenDaysAgo, 7)).toBe(false);
    expect(shouldDowngradeToFree('PAST_DUE', tenDaysAgo)).toBe(true);
    expect(shouldDowngradeToFree('CANCELED')).toBe(true);
  });
});

describe('API Key Cryptography & Scopes', () => {
  it('generates prefixed keys and non-reversible SHA256 hashes', () => {
    const key = generateApiKey('orb_live');
    expect(key.rawKey.startsWith('orb_live_')).toBe(true);
    expect(key.keyPrefix.startsWith('orb_live_')).toBe(true);
    expect(key.keyHash).toBe(hashApiKey(key.rawKey));
    expect(key.keyHash).not.toContain('orb_live');
  });

  it('validates required scopes against granted scopes', () => {
    const granted = ['posts:read', 'posts:write', 'channels:read'];
    expect(hasScope(granted, 'posts:read')).toBe(true);
    expect(hasScope(granted, 'posts:write')).toBe(true);
    expect(hasScope(granted, 'webhooks:manage')).toBe(false);

    // Wildcard bypass
    expect(hasScope(['*'], 'any:scope')).toBe(true);
  });
});

describe('Outbound Webhook HMAC-SHA256 Signing & Verification', () => {
  const secret = 'sec_orbitly_webhook_test_signing_key_99';
  const payload = JSON.stringify({ event: 'post.published', postId: 'p_123' });

  it('signs payload and verifies successfully with current timestamp', () => {
    const signed = signOutboundWebhook(payload, secret);
    expect(signed.signature.startsWith('t=')).toBe(true);
    expect(signed.signature).toContain('v1=');

    const result = verifyOutboundWebhook(payload, signed.signature, secret);
    expect(result.valid).toBe(true);
  });

  it('rejects tampered payloads and mismatched secrets', () => {
    const signed = signOutboundWebhook(payload, secret);
    const tamperedPayload = JSON.stringify({ event: 'post.published', postId: 'tampered' });

    const tamperedRes = verifyOutboundWebhook(tamperedPayload, signed.signature, secret);
    expect(tamperedRes.valid).toBe(false);

    const wrongSecretRes = verifyOutboundWebhook(payload, signed.signature, 'wrong_secret');
    expect(wrongSecretRes.valid).toBe(false);
  });

  it('enforces 5-minute replay window rejection', () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const signed = signOutboundWebhook(payload, secret, staleTimestamp);

    const res = verifyOutboundWebhook(payload, signed.signature, secret);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('expired');
  });
});
