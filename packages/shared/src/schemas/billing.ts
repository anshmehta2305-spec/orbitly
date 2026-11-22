import { z } from 'zod';
import { PlanTier } from '../types';

export const CheckoutSessionSchema = z.object({
  planTier: z.nativeEnum(PlanTier),
  interval: z.enum(['month', 'year']).default('month'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']).default('USD'),
  seats: z.number().int().min(1).default(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CheckoutSessionInput = z.infer<typeof CheckoutSessionSchema>;

export const CustomerPortalSessionSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type CustomerPortalSessionInput = z.infer<typeof CustomerPortalSessionSchema>;

export const CancelSubscriptionSchema = z.object({
  reason: z.string().min(3).max(500),
  feedback: z.string().max(1000).optional(),
});

export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;
