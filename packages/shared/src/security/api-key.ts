import * as crypto from 'crypto';

export const API_KEY_SCOPES = [
  'posts:read',
  'posts:write',
  'channels:read',
  'media:write',
  'analytics:read',
  'webhooks:manage',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(prefix = 'orb_live'): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomBytes = crypto.randomBytes(24).toString('hex'); // 48 chars
  const rawKey = `${prefix}_${randomBytes}`;
  const keyPrefix = `${prefix}_${randomBytes.slice(0, 8)}`;
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

export function hasScope(grantedScopes: string[], requiredScope: string): boolean {
  if (grantedScopes.includes('*') || grantedScopes.includes('admin')) {
    return true;
  }
  return grantedScopes.includes(requiredScope);
}
