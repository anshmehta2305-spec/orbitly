import { prisma, SubscriptionStatus, PlanTier } from '@orbitly/db';

export async function processPaymentEvents(): Promise<{ processed: number }> {
  const pendingEvents = await prisma.paymentEvent.findMany({
    where: { processedAt: null },
    take: 20,
    orderBy: { createdAt: 'asc' },
  });

  let processed = 0;

  for (const event of pendingEvents) {
    try {
      const payload: any = event.payload || {};
      const obj = payload.data?.object || payload.payload?.subscription?.entity || {};
      const workspaceId = obj.metadata?.workspaceId || obj.notes?.workspaceId;

      if (workspaceId && event.type.includes('subscription')) {
        const planTier = (obj.metadata?.planTier as PlanTier) || PlanTier.PRO;
        await prisma.subscription.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            planTier,
            planKey: planTier,
            status: SubscriptionStatus.ACTIVE,
            currency: obj.currency?.toUpperCase() || 'USD',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {
            planTier,
            planKey: planTier,
            status: SubscriptionStatus.ACTIVE,
          },
        });
      }

      await prisma.paymentEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      processed++;
    } catch (err: any) {
      await prisma.paymentEvent.update({
        where: { id: event.id },
        data: { error: err.message },
      });
    }
  }

  return { processed };
}
