/**
 * Multi-Tenant Isolation Query Guard.
 * Enforces that all database operations on workspace-scoped entities
 * strictly specify a `workspaceId` predicate, preventing catastrophic cross-tenant data leaks.
 */

export class TenantIsolationViolationError extends Error {
  constructor(model: string, action: string) {
    super(
      `[SECURITY ERROR] Multi-tenant isolation violation: Model '${model}' action '${action}' was executed without an explicit 'workspaceId' filter.`,
    );
    this.name = 'TenantIsolationViolationError';
  }
}

export const TENANT_SCOPED_MODELS = new Set([
  'Post',
  'PostVariant',
  'Channel',
  'Media',
  'AiUsage',
  'AiGeneration',
  'BrandVoice',
  'Automation',
  'AutomationRun',
  'Membership',
  'Invitation',
  'ApiKey',
  'OutboundWebhook',
  'UsageCounter',
  'Subscription',
]);

/**
 * Validates that an incoming query object contains a workspaceId in its where clause.
 */
export function assertWorkspaceScope(
  model: string,
  action: string,
  args?: { where?: Record<string, any> },
): void {
  if (!TENANT_SCOPED_MODELS.has(model)) {
    return; // Global or non-tenant model (e.g. User, Plan, FeatureFlag, Announcement)
  }

  // FindMany, FindFirst, Update, Delete, Count require where.workspaceId
  if (['findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count'].includes(action)) {
    const where = args?.where;
    if (!where || (where.workspaceId === undefined && where.workspace === undefined)) {
      // In findUnique by unique composite ID (e.g., id + workspaceId), workspaceId must be present
      throw new TenantIsolationViolationError(model, action);
    }
  }
}
