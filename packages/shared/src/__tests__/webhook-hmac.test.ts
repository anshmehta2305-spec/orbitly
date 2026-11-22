import { describe, it, expect } from 'vitest';
import { verifyWebhookSignature } from '../security/webhook-hmac';
import * as crypto from 'crypto';

describe('Webhook HMAC-SHA256 Signature & Replay Verification', () => {
  const secret = 'super-secret-signing-key-1234567890';
  const payload = JSON.stringify({ content: 'Published via Webhook', author: 'API' });

  it('validates a correct HMAC signature with timestamp', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const header = `t=${timestamp},v1=${signature}`;
    const result = verifyWebhookSignature({
      payload,
      signingSecret: secret,
      signatureHeader: header,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects an altered payload (tampering protection)', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const result = verifyWebhookSignature({
      payload: JSON.stringify({ content: 'TAMPERED CONTENT' }),
      signingSecret: secret,
      signatureHeader: `t=${timestamp},v1=${signature}`,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('HMAC signature mismatch.');
  });

  it('rejects expired timestamps outside 5-minute replay window', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // ~6.6 minutes ago
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${oldTimestamp}.${payload}`)
      .digest('hex');

    const result = verifyWebhookSignature({
      payload,
      signingSecret: secret,
      signatureHeader: `t=${oldTimestamp},v1=${signature}`,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('replay window');
  });
});
