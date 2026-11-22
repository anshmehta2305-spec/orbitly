import { PlanTier } from '../types';
import { PLAN_SPECS, PlanLimits } from '../constants/plans';

/**
 * Single source of truth entitlement checks.
 */
export function can(plan: PlanTier, feature: string): boolean {
  const specs = PLAN_SPECS[plan];
  if (!specs) return false;

  switch (feature) {
    case 'white_label':
    case 'client_portal':
      return specs.limits.whiteLabel;
    case 'unlimited_history':
      return specs.limits.analyticsRetentionDays >= 365;
    case 'automations':
      return specs.limits.automations > 1;
    case 'advanced_approvals':
      return plan === PlanTier.TEAM || plan === PlanTier.AGENCY;
    case 'public_api':
      return plan !== PlanTier.FREE;
    default:
      return true;
  }
}

export function checkLimit(
  currentCount: number,
  plan: PlanTier,
  metric: keyof PlanLimits,
): { allowed: boolean; limit: number; remaining: number } {
  const specs = PLAN_SPECS[plan] || PLAN_SPECS[PlanTier.FREE];
  const limitValue = specs.limits[metric];

  if (typeof limitValue !== 'number') {
    return { allowed: true, limit: 999999, remaining: 999999 };
  }

  const remaining = Math.max(0, limitValue - currentCount);
  const allowed = currentCount < limitValue;

  return {
    allowed,
    limit: limitValue,
    remaining,
  };
}

/**
 * 7-day grace period check on past due payments before downgrading
 */
export function isGracePeriodActive(pastDueSince: Date, graceDays = 7): boolean {
  const elapsedMs = Date.now() - pastDueSince.getTime();
  const maxGraceMs = graceDays * 24 * 60 * 60 * 1000;
  return elapsedMs < maxGraceMs;
}

export function shouldDowngradeToFree(status: string, pastDueSince?: Date): boolean {
  if (status === 'CANCELED') return true;
  if (status === 'PAST_DUE') {
    if (!pastDueSince) return false;
    return !isGracePeriodActive(pastDueSince, 7);
  }
  return false;
}
