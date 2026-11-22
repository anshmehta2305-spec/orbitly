import { describe, it, expect } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  rotateSecret,
  isKeyRotationNeeded,
} from '../security/encryption';

describe('Encryption & Key Rotation (AES-256-GCM)', () => {
  const customKeyStore: Record<string, string> = {
    v1: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    v2: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
  };

  it('encrypts and decrypts secret with key version tag v1', () => {
    const original = 'super_secret_oauth_token_12345';
    const encrypted = encryptSecret(original, 'v1', customKeyStore);

    expect(encrypted.startsWith('v1:')).toBe(true);
    const parts = encrypted.split(':');
    expect(parts.length).toBe(4); // v1:iv:tag:ciphertext

    const decrypted = decryptSecret(encrypted, undefined, customKeyStore);
    expect(decrypted).toBe(original);
  });

  it('detects when key rotation is needed', () => {
    const encryptedV1 = encryptSecret('token', 'v1', customKeyStore);
    const encryptedV2 = encryptSecret('token', 'v2', customKeyStore);

    expect(isKeyRotationNeeded(encryptedV1, 'v2')).toBe(true);
    expect(isKeyRotationNeeded(encryptedV2, 'v2')).toBe(false);
  });

  it('rotates secret from v1 to v2 safely preserving plaintext', () => {
    const original = 'discord_webhook_secret_url_xyz';
    const encryptedV1 = encryptSecret(original, 'v1', customKeyStore);

    // Rotate to v2
    const rotated = rotateSecret(encryptedV1, 'v2', customKeyStore);
    expect(rotated.startsWith('v2:')).toBe(true);

    // Decrypt using v2
    const decrypted = decryptSecret(rotated, undefined, customKeyStore);
    expect(decrypted).toBe(original);
  });

  it('throws error on tampered ciphertext', () => {
    const encrypted = encryptSecret('sensitive_key', 'v1', customKeyStore);
    const parts = encrypted.split(':');
    // Tamper ciphertext
    parts[3] = parts[3].slice(0, -2) + 'ff';
    const tampered = parts.join(':');

    expect(() => decryptSecret(tampered, undefined, customKeyStore)).toThrow();
  });
});