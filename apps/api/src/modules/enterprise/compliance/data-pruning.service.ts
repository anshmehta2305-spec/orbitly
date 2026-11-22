import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { DataRetentionPolicyInput } from '@orbitly/shared';

@Injectable()
export class DataPruningService {
  /**
   * Asserts that a workspace is not under an active legal hold.
   * If legal hold is active, destructive deletions are completely frozen.
   */
  async assertNoLegalHold(workspaceId: string): Promise<void> {
    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
      select: { legalHold: true },
    });

    if (settings?.legalHold) {
      throw new ForbiddenException(
        'Workspace is under an active legal hold. Data pruning and deletion operations are frozen.',
      );
    }
  }

  /**
   * Updates data retention thresholds and legal hold status
   */
  async updateRetentionPolicy(workspaceId: string, input: DataRetentionPolicyInput) {
    const settings = await prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: {
        analyticsRetentionDays: input.analyticsRetentionDays,
        auditLogRetentionDays: input.auditLogRetentionDays,
        deletedPostRetentionDays: input.deletedPostRetentionDays,
        legalHold: input.legalHold,
      },
      create: {
        workspaceId,
        analyticsRetentionDays: input.analyticsRetentionDays,
        auditLogRetentionDays: input.auditLogRetentionDays,
        deletedPostRetentionDays: input.deletedPostRetentionDays,
        legalHold: input.legalHold,
      },
    });

    return settings;
  }

  /**
   * Executes scheduled data pruning according to workspace compliance policy
   */
  async pruneWorkspaceData(workspaceId: string): Promise<{
    skipped: boolean;
    reason?: string;
    prunedAnalytics?: number;
    prunedAuditLogs?: number;
    purgedDeletedPosts?: number;
  }> {
    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings) {
      throw new NotFoundException(`Workspace settings not found for '${workspaceId}'`);
    }

    // 1. Legal Hold check
    if (settings.legalHold) {
      console.log(`⚖️ [LegalHold] Workspace ${workspaceId} is under active legal hold. Pruning skipped.`);
      return { skipped: true, reason: 'LEGAL_HOLD_ACTIVE' };
    }

    const now = Date.now();
    const analyticsCutoff = new Date(now - settings.analyticsRetentionDays * 24 * 60 * 60 * 1000);
    const auditCutoff = new Date(now - settings.auditLogRetentionDays * 24 * 60 * 60 * 1000);
    const deletedPostCutoff = new Date(now - settings.deletedPostRetentionDays * 24 * 60 * 60 * 1000);

    // 2. Prune expired Analytics Snapshots
    const analyticsResult = await prisma.analyticsSnapshot.deleteMany({
      where: {
        channel: { workspaceId },
        date: { lt: analyticsCutoff },
      },
    });

    // 3. Prune expired Audit Logs
    const auditResult = await prisma.auditLog.deleteMany({
      where: {
        workspaceId,
        createdAt: { lt: auditCutoff },
      },
    });

    // 4. Purge soft-deleted Posts past retention
    const postsResult = await prisma.post.deleteMany({
      where: {
        workspaceId,
        deletedAt: { not: null, lt: deletedPostCutoff },
      },
    });

    console.log(
      `🧹 [Data Pruning Completed] Workspace: ${workspaceId} | Pruned Analytics: ${analyticsResult.count} | Pruned AuditLogs: ${auditResult.count} | Purged Posts: ${postsResult.count}`,
    );

    return {
      skipped: false,
      prunedAnalytics: analyticsResult.count,
      prunedAuditLogs: auditResult.count,
      purgedDeletedPosts: postsResult.count,
    };
  }
}
