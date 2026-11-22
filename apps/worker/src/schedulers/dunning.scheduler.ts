import { prisma, SubscriptionStatus, PlanTier } from '@orbitly/db';
import { isGracePeriodActive } from '@orbitly/shared';

/**
 * Checks for past-due subscriptions, enforces 7-day grace period,
 * and executes automatic downgrade to Free tier if unpaid.
 */
export async function runDunningAndDowngradeCheck(): Promise<{
  checked: number;
  downgraded: number;
}> {
  console.log('[DunningScheduler] 💳 Running payment dunning and grace period inspection...');

  const pastDueSubscriptions = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.PAST_DUE },
    include: { workspace: true },
  });

  let checked = 0;
  let downgraded = 0;

  for (const sub of pastDueSubscriptions) {
    checked++;
    const pastDueSince = sub.updatedAt;

    if (!isGracePeriodActive(pastDueSince, 7)) {
      console.warn(
        `[DunningScheduler] ⚠️ Workspace ${sub.workspaceId} (${sub.workspace.name}) exceeded 7-day grace period. Executing policy downgrade to FREE.`,
      );

      // Downgrade to FREE
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planTier: PlanTier.FREE,
          planKey: PlanTier.FREE,
          status: SubscriptionStatus.UNPAID,
        },
      });

      // Pause posts beyond Free limit
      await prisma.post.updateMany({
        where: {
          workspaceId: sub.workspaceId,
          status: 'SCHEDULED',
        },
        data: {
          status: 'DRAFT',
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          workspaceId: sub.workspaceId,
          action: 'BILLING_GRACE_PERIOD_EXPIRED_DOWNGRADE',
          entityType: 'SUBSCRIPTION',
          entityId: sub.id,
          metadataJson: { previousPlan: sub.planTier, downgradedAt: new Date().toISOString() },
        },
      });

      downgraded++;
    } else {
      console.log(`[DunningScheduler] ℹ️ Workspace ${sub.workspaceId} is within 7-day grace period. Dunning notice active.`);
    }
  }

  return { checked, downgraded };
}
