import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, SubscriptionStatus, BillingProvider } from '@orbitly/db';
import {
  PLAN_SPECS,
  can,
  checkLimit,
  CheckoutSessionInput,
  CancelSubscriptionInput,
  PlanLimits,
  PlanTier,
} from '@orbitly/shared';
import { StripePaymentProvider } from './providers/stripe.provider';
import { RazorpayPaymentProvider } from './providers/razorpay.provider';

@Injectable()
export class BillingService {
  private stripeProvider = new StripePaymentProvider();
  private razorpayProvider = new RazorpayPaymentProvider();

  getProvider(provider: BillingProvider = BillingProvider.STRIPE) {
    if (provider === BillingProvider.RAZORPAY) {
      return this.razorpayProvider;
    }
    return this.stripeProvider;
  }

  getPlans() {
    return PLAN_SPECS;
  }

  async getWorkspaceBilling(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        channels: { select: { id: true } },
        memberships: { select: { id: true } },
        posts: { select: { id: true } },
        aiCredit: true,
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const sub = workspace.subscription;
    const planKey = (sub?.planKey as PlanTier) || PlanTier.FREE;
    const planSpecs = PLAN_SPECS[planKey];

    // Current usage counters
    const channelCount = workspace.channels.length;
    const memberCount = workspace.memberships.length;
    const postCount = workspace.posts.length;
    const aiUsed = (planSpecs.limits.aiCredits || 20) - (workspace.aiCredit?.balance ?? 20);

    return {
      workspaceId: workspace.id,
      plan: {
        key: planKey,
        name: planSpecs.name,
        tagline: planSpecs.tagline,
        limits: planSpecs.limits,
        prices: planSpecs.prices,
      },
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            provider: sub.provider,
            currency: sub.currency,
            interval: sub.interval,
            seats: sub.seats,
            trialEndsAt: sub.trialEndsAt,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          }
        : null,
      usage: {
        channels: { current: channelCount, limit: planSpecs.limits.channels, percent: Math.round((channelCount / planSpecs.limits.channels) * 100) },
        members: { current: memberCount, limit: planSpecs.limits.seats, percent: Math.round((memberCount / planSpecs.limits.seats) * 100) },
        posts: { current: postCount, limit: planSpecs.limits.postsPerMonth, percent: Math.round((postCount / planSpecs.limits.postsPerMonth) * 100) },
        aiCredits: { current: Math.max(0, aiUsed), limit: planSpecs.limits.aiCredits, balance: workspace.aiCredit?.balance ?? 20 },
      },
      invoices: workspace.invoices,
    };
  }

  async createCheckout(workspaceId: string, input: CheckoutSessionInput): Promise<{ url: string }> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const providerType = input.currency === 'INR' && process.env.RAZORPAY_ENABLED === 'true'
      ? BillingProvider.RAZORPAY
      : BillingProvider.STRIPE;

    const provider = this.getProvider(providerType);

    const successUrl = input.successUrl || `http://localhost:3000/en/settings/billing?checkout=success`;
    const cancelUrl = input.cancelUrl || `http://localhost:3000/en/settings/billing?checkout=cancelled`;

    const session = await provider.createCheckoutSession({
      customerId: workspace.subscription?.providerCustomerId || undefined,
      workspaceId: workspace.id,
      planTier: input.planTier,
      interval: input.interval,
      currency: input.currency,
      seats: input.seats,
      successUrl,
      cancelUrl,
    });

    return { url: session.url };
  }

  async createPortal(workspaceId: string, returnUrl?: string): Promise<{ url: string }> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const customerId = workspace.subscription?.providerCustomerId || workspace.subscription?.customerId || 'cus_demo';
    const provider = this.stripeProvider;

    const retUrl = returnUrl || `http://localhost:3000/en/settings/billing`;
    return provider.createCustomerPortalSession({
      customerId,
      returnUrl: retUrl,
    });
  }

  async cancelSubscription(workspaceId: string, input: CancelSubscriptionInput): Promise<any> {
    const sub = await prisma.subscription.findUnique({
      where: { workspaceId },
    });
    if (!sub) throw new NotFoundException('Active subscription not found');

    if (sub.providerSubscriptionId) {
      const provider = this.getProvider(sub.provider);
      await provider.cancelSubscription(sub.providerSubscriptionId);
    }

    const updated = await prisma.subscription.update({
      where: { workspaceId },
      data: {
        cancelAtPeriodEnd: true,
        status: SubscriptionStatus.CANCELED,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        action: 'SUBSCRIPTION_CANCEL',
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        metadataJson: { reason: input.reason, feedback: input.feedback },
      },
    });

    return {
      message: 'Subscription scheduled for cancellation at the end of billing period. Your data remains safe.',
      subscription: updated,
    };
  }

  async handleWebhook(providerType: BillingProvider, rawBody: string | Buffer, signature: string): Promise<any> {
    const provider = this.getProvider(providerType);
    const parsed = await provider.verifyAndParseWebhook(rawBody, signature);

    // 1. Idempotency check via PaymentEvent
    const existing = await prisma.paymentEvent.findUnique({
      where: { eventId: parsed.eventId },
    });
    if (existing) {
      return { received: true, duplicate: true };
    }

    // 2. Record raw event
    await prisma.paymentEvent.create({
      data: {
        provider: providerType,
        eventId: parsed.eventId,
        type: parsed.type,
        payload: parsed.raw,
        processedAt: new Date(),
      },
    });

    // 3. Process subscription state mutations
    if (parsed.workspaceId && parsed.planTier) {
      await prisma.subscription.upsert({
        where: { workspaceId: parsed.workspaceId },
        create: {
          workspaceId: parsed.workspaceId,
          planTier: parsed.planTier,
          planKey: parsed.planTier,
          status: SubscriptionStatus.ACTIVE,
          provider: providerType,
          providerCustomerId: parsed.customerId,
          providerSubscriptionId: parsed.subscriptionId,
          currency: parsed.currency || 'USD',
          currentPeriodStart: parsed.currentPeriodStart || new Date(),
          currentPeriodEnd: parsed.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
        update: {
          planTier: parsed.planTier,
          planKey: parsed.planTier,
          status: (parsed.status?.toUpperCase() as any) || SubscriptionStatus.ACTIVE,
          currentPeriodEnd: parsed.currentPeriodEnd,
          cancelAtPeriodEnd: parsed.cancelAtPeriodEnd ?? false,
        },
      });
    }

    return { received: true, eventId: parsed.eventId };
  }

  // Entitlement gate checks
  canAccess(plan: PlanTier, feature: string): boolean {
    return can(plan, feature);
  }

  checkLimit(current: number, plan: PlanTier, metric: keyof PlanLimits) {
    return checkLimit(current, plan, metric);
  }
}
