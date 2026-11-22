import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export const DEFAULT_KEY_ID = 'v1';

// Supported keys map (can be loaded from env e.g. TOKEN_ENCRYPTION_KEY_V1, TOKEN_ENCRYPTION_KEY)
export const KEY_STORE: Record<string, string> = {
  v1:
    process.env.TOKEN_ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  v2:
    process.env.TOKEN_ENCRYPTION_KEY_V2 ||
    'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
};

function resolveKey(keyId: string, customKeys?: Record<string, string>): Buffer {
  const keys = customKeys || KEY_STORE;
  const keyHex = keys[keyId] || keys[DEFAULT_KEY_ID];
  if (!keyHex) {
    throw new Error(`Encryption key for keyId '${keyId}' not found.`);
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error(`Encryption key '${keyId}' must be a 32-byte hex string (64 characters)`);
  }
  return key;
}

/**
 * Encrypts a secret with a specific keyId for rotation support.
 * Returns: `keyId:iv:authTag:ciphertext`
 */
export function encryptSecret(
  plainText: string,
  keyIdOrMasterKeyHex: string = DEFAULT_KEY_ID,
  customKeys?: Record<string, string>,
): string {
  let key: Buffer;
  let keyId = DEFAULT_KEY_ID;

  if (keyIdOrMasterKeyHex.length === 64) {
    // Direct hex key provided
    key = Buffer.from(keyIdOrMasterKeyHex, 'hex');
  } else {
    keyId = keyIdOrMasterKeyHex;
    key = resolveKey(keyId, customKeys);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${keyId}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts secret payload. Handles both `keyId:iv:tag:ciphertext` (4 parts)
 * and legacy `iv:tag:ciphertext` (3 parts, assumed v1).
 */
export function decryptSecret(
  encryptedPayload: string,
  keyIdOrMasterKeyHex?: string,
  customKeys?: Record<string, string>,
): string {
  const parts = encryptedPayload.split(':');
  let keyId = DEFAULT_KEY_ID;
  let ivHex: string;
  let tagHex: string;
  let ciphertext: string;

  if (parts.length === 4) {
    [keyId, ivHex, tagHex, ciphertext] = parts;
  } else if (parts.length === 3) {
    [ivHex, tagHex, ciphertext] = parts;
  } else {
    throw new Error('Invalid encrypted payload format');
  }

  let key: Buffer;
  if (keyIdOrMasterKeyHex && keyIdOrMasterKeyHex.length === 64) {
    key = Buffer.from(keyIdOrMasterKeyHex, 'hex');
  } else {
    key = resolveKey(keyIdOrMasterKeyHex || keyId, customKeys);
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Checks if a payload needs key rotation to targetKeyId
 */
export function isKeyRotationNeeded(
  encryptedPayload: string,
  targetKeyId: string = DEFAULT_KEY_ID,
): boolean {
  const parts = encryptedPayload.split(':');
  if (parts.length === 4) {
    return parts[0] !== targetKeyId;
  }
  // 3-part legacy payload without key prefix
  return true;
}

/**
 * Re-encrypts payload from its current key to targetKeyId (Key Rotation)
 */
export function rotateSecret(
  encryptedPayload: string,
  targetKeyId: string = 'v2',
  customKeys?: Record<string, string>,
): string {
  const decrypted = decryptSecret(encryptedPayload, undefined, customKeys);
  return encryptSecret(decrypted, targetKeyId, customKeys);
}

/**
 * SHA-256 hash for API keys
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
