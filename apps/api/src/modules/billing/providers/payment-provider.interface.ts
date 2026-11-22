import { PlanTier } from '@orbitly/shared';

export interface CreateCustomerParams {
  email: string;
  name?: string;
  workspaceId: string;
}

export interface CheckoutSessionParams {
  customerId?: string;
  workspaceId: string;
  planTier: PlanTier;
  interval: 'month' | 'year';
  currency: string;
  seats?: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CustomerPortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface PaymentWebhookResult {
  eventId: string;
  type: string;
  workspaceId?: string;
  subscriptionId?: string;
  customerId?: string;
  planTier?: PlanTier;
  status?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  amount?: number;
  currency?: string;
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  raw: any;
}

export interface PaymentProvider {
  id: 'STRIPE' | 'RAZORPAY';
  isAvailable(): boolean;
  createCustomer(params: CreateCustomerParams): Promise<string>;
  createCheckoutSession(params: CheckoutSessionParams): Promise<{ url: string; sessionId: string }>;
  createCustomerPortalSession?(params: CustomerPortalSessionParams): Promise<{ url: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  verifyAndParseWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<PaymentWebhookResult>;
}
