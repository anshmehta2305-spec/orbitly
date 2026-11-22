import * as crypto from 'crypto';

/**
 * Outbound Webhook HMAC-SHA256 Signer & Verifier
 */
export function signOutboundWebhook(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): { signature: string; timestamp: number } {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return {
    signature: `t=${timestamp},v1=${signature}`,
    timestamp,
  };
}

export function verifyOutboundWebhook(
  payload: string,
  signatureHeader: string,
  secret: string,
  maxAgeSeconds = 300,
): { valid: boolean; reason?: string } {
  if (!signatureHeader || !signatureHeader.includes('t=') || !signatureHeader.includes('v1=')) {
    return { valid: false, reason: 'Malformed signature header format' };
  }

  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const part of signatureHeader.split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') timestamp = parseInt(v, 10);
    if (k === 'v1') signature = v;
  }

  if (!timestamp || !signature) {
    return { valid: false, reason: 'Missing timestamp or v1 signature' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > maxAgeSeconds) {
    return { valid: false, reason: 'Signature timestamp expired (outside 5-minute replay window)' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expectedSignature, 'hex');

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'Signature mismatch' };
  }

  return { valid: true };
}
