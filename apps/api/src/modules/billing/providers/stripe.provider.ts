import {
  PaymentProvider,
  CreateCustomerParams,
  CheckoutSessionParams,
  CustomerPortalSessionParams,
  PaymentWebhookResult,
} from './payment-provider.interface';
import { PlanTier } from '@orbitly/shared';
import * as crypto from 'crypto';

export class StripePaymentProvider implements PaymentProvider {
  id = 'STRIPE' as const;

  isAvailable(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  async createCustomer(params: CreateCustomerParams): Promise<string> {
    if (!this.isAvailable()) {
      return `cus_mock_${Date.now()}`;
    }
    // Stripe REST API call
    const res = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: params.email,
        name: params.name || '',
        'metadata[workspaceId]': params.workspaceId,
      }),
    });
    const data = await res.json();
    return data.id;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<{ url: string; sessionId: string }> {
    if (!this.isAvailable()) {
      return {
        url: `${params.successUrl}?session_id=cs_mock_${Date.now()}&mock_checkout=true`,
        sessionId: `cs_mock_${Date.now()}`,
      };
    }

    const priceId = process.env[`STRIPE_${params.planTier}_${params.interval.toUpperCase()}_PRICE_ID`] || 'price_default';
    const bodyParams = new URLSearchParams({
      mode: 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': String(params.seats || 1),
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      'metadata[workspaceId]': params.workspaceId,
      'metadata[planTier]': params.planTier,
      'subscription_data[trial_period_days]': '14',
    });

    if (params.customerId) {
      bodyParams.append('customer', params.customerId);
    }

    // Stripe Tax
    if (process.env.STRIPE_TAX_ENABLED === 'true') {
      bodyParams.append('automatic_tax[enabled]', 'true');
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams,
    });

    const data = await res.json();
    return {
      url: data.url,
      sessionId: data.id,
    };
  }

  async createCustomerPortalSession(params: CustomerPortalSessionParams): Promise<{ url: string }> {
    if (!this.isAvailable()) {
      return { url: `${params.returnUrl}?mock_portal=true` };
    }

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: params.customerId,
        return_url: params.returnUrl,
      }),
    });
    const data = await res.json();
    return { url: data.url };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.isAvailable()) return;

    await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    });
  }

  async verifyAndParseWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<PaymentWebhookResult> {
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && signatureHeader) {
      // Signature verification: t=timestamp,v1=signature
      let timestamp = '';
      let sig = '';
      for (const item of signatureHeader.split(',')) {
        const [k, v] = item.split('=');
        if (k === 't') timestamp = v;
        if (k === 'v1') sig = v;
      }
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${rawString}`)
        .digest('hex');

      if (expected !== sig && !process.env.DISABLE_WEBHOOK_VERIFY) {
        throw new Error('Stripe webhook signature mismatch');
      }
    }

    const event = JSON.parse(rawString);
    const obj = event.data?.object || {};

    let planTier: PlanTier | undefined;
    if (obj.metadata?.planTier) {
      planTier = obj.metadata.planTier as PlanTier;
    }

    return {
      eventId: event.id || `evt_${Date.now()}`,
      type: event.type,
      workspaceId: obj.metadata?.workspaceId,
      customerId: obj.customer,
      subscriptionId: obj.subscription || (obj.id?.startsWith('sub_') ? obj.id : undefined),
      planTier,
      status: obj.status,
      currentPeriodStart: obj.current_period_start ? new Date(obj.current_period_start * 1000) : undefined,
      currentPeriodEnd: obj.current_period_end ? new Date(obj.current_period_end * 1000) : undefined,
      cancelAtPeriodEnd: obj.cancel_at_period_end,
      amount: obj.amount_paid || obj.amount_due,
      currency: obj.currency?.toUpperCase(),
      hostedInvoiceUrl: obj.hosted_invoice_url,
      pdfUrl: obj.invoice_pdf,
      raw: event,
    };
  }
}
