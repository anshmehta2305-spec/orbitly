import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret, hashToken } from '../security/encryption';

describe('Encryption & Token Hashing', () => {
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('should encrypt and decrypt a social media access token roundtrip', () => {
    const rawToken = 'gho_1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encryptSecret(rawToken, masterKey);

    expect(encrypted).not.toEqual(rawToken);
    expect(encrypted.split(':')).toHaveLength(4); // keyId:iv:tag:ciphertext

    const decrypted = decryptSecret(encrypted, masterKey);
    expect(decrypted).toBe(rawToken);
  });

  it('should generate consistent SHA-256 token hashes for lookups', () => {
    const token = 'orbitly_pat_987654321';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('fails decryption gracefully if payload is tampered', () => {
    const rawToken = 'secret-token';
    const encrypted = encryptSecret(rawToken, masterKey);
    const parts = encrypted.split(':');
    // Tamper the ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}aa`;

    expect(() => decryptSecret(tampered, masterKey)).toThrow();
  });
});
