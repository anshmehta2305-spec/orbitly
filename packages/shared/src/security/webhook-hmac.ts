import * as crypto from 'crypto';

/**
 * Webhook HMAC-SHA256 signature verification with replay protection.
 * Format:
 * Headers expected:
 *   X-Orbitly-Signature: t=1700000000,v1=hex_hmac_hash
 *   or standard hex HMAC
 */

export function verifyWebhookSignature(params: {
  payload: string | Buffer;
  signingSecret: string;
  signatureHeader: string;
  timestampHeader?: string;
  maxAgeSeconds?: number;
}): { valid: boolean; reason?: string } {
  const maxAge = params.maxAgeSeconds ?? 300; // 5-minute replay window

  let signature = params.signatureHeader;
  let timestamp: number | null = null;

  if (signature.includes('t=') && signature.includes('v1=')) {
    const parts = signature.split(',');
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k === 't') timestamp = parseInt(v, 10);
      if (k === 'v1') signature = v;
    }
  } else if (params.timestampHeader) {
    timestamp = parseInt(params.timestampHeader, 10);
  }

  // Replay check if timestamp provided
  if (timestamp) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxAge) {
      return { valid: false, reason: 'Webhook timestamp outside acceptable replay window (5 min).' };
    }
  }

  const rawPayload = typeof params.payload === 'string' ? params.payload : params.payload.toString('utf8');
  const signedData = timestamp ? `${timestamp}.${rawPayload}` : rawPayload;

  const expectedSignature = crypto
    .createHmac('sha256', params.signingSecret)
    .update(signedData)
    .digest('hex');

  // Constant-time compare
  try {
    const bufA = Buffer.from(signature, 'hex');
    const bufB = Buffer.from(expectedSignature, 'hex');
    if (bufA.length !== bufB.length) return { valid: false, reason: 'Invalid signature length.' };
    const match = crypto.timingSafeEqual(bufA, bufB);
    return { valid: match, reason: match ? undefined : 'HMAC signature mismatch.' };
  } catch {
    return { valid: false, reason: 'Malformed HMAC signature.' };
  }
}
