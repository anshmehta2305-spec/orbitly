import {
  PaymentProvider,
  CreateCustomerParams,
  CheckoutSessionParams,
  PaymentWebhookResult,
} from './payment-provider.interface';
import * as crypto from 'crypto';

/**
 * Razorpay Payment Provider (INR only)
 * Behind RAZORPAY_ENABLED env flag.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  id = 'RAZORPAY' as const;

  isAvailable(): boolean {
    return process.env.RAZORPAY_ENABLED === 'true' && !!process.env.RAZORPAY_KEY_ID;
  }

  async createCustomer(params: CreateCustomerParams): Promise<string> {
    if (!this.isAvailable()) {
      return `cust_rzp_mock_${Date.now()}`;
    }
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name || 'Orbitly User',
        notes: { workspaceId: params.workspaceId },
      }),
    });
    const data = await res.json();
    return data.id;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<{ url: string; sessionId: string }> {
    if (params.currency !== 'INR') {
      throw new Error('Razorpay is only available for transactions in INR.');
    }

    if (!this.isAvailable()) {
      return {
        url: `${params.successUrl}?rzp_payment_id=pay_mock_${Date.now()}`,
        sessionId: `sub_rzp_mock_${Date.now()}`,
      };
    }

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: params.planTier,
        total_count: params.interval === 'year' ? 1 : 12,
        quantity: params.seats || 1,
        notes: {
          workspaceId: params.workspaceId,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay subscription creation failed: ${err}`);
    }

    const data = await res.json();
    return {
      url: data.short_url || `${params.successUrl}?subscription_id=${data.id}`,
      sessionId: data.id,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.isAvailable()) return;
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString('base64');

    await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
    });
  }

  async verifyAndParseWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<PaymentWebhookResult> {
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret && signatureHeader) {
      const expected = crypto.createHmac('sha256', secret).update(rawString).digest('hex');
      if (expected !== signatureHeader && !process.env.DISABLE_WEBHOOK_VERIFY) {
        throw new Error('Razorpay webhook signature mismatch');
      }
    }

    const event = JSON.parse(rawString);
    const payload = event.payload || {};
    const entity = payload.subscription?.entity || payload.payment?.entity || {};

    return {
      eventId: event.id || `evt_rzp_${Date.now()}`,
      type: event.event,
      workspaceId: entity.notes?.workspaceId,
      customerId: entity.customer_id,
      subscriptionId: entity.id,
      status: entity.status,
      amount: entity.amount,
      currency: 'INR',
      raw: event,
    };
  }
}
