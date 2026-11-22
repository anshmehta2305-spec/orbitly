import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@orbitly/db';
import {
  UpdateWorkspaceSettingsInput,
  PLAN_LIMITS,
  PlanTier,
} from '@orbitly/shared';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class WorkspaceSettingsService {
  constructor(private auditService: AuditService) {}

  async getSettings(workspaceId: string): Promise<any> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: true,
        settings: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const tier = (workspace.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const planLimit = PLAN_LIMITS[tier] || PLAN_LIMITS[PlanTier.FREE];

    // Ensure settings exist (upsert default if null)
    let settings = workspace.settings;
    if (!settings) {
      settings = await prisma.workspaceSettings.create({
        data: {
          workspaceId,
          approvalRequired: false,
          approvalMode: 'ANY_ADMIN',
          approverIds: [],
          autoPublishAfterApproval: true,
          defaultTimezone: workspace.timezone || 'UTC',
        },
      });
    }

    return {
      settings,
      capabilities: {
        planTier: tier,
        whiteLabelAllowed: planLimit.whiteLabel,
      },
    };
  }

  async updateSettings(
    workspaceId: string,
    operatorUserId: string,
    input: UpdateWorkspaceSettingsInput,
  ): Promise<any> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const tier = (workspace.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const planLimit = PLAN_LIMITS[tier] || PLAN_LIMITS[PlanTier.FREE];

    // White-label check: custom branding requires TEAM or AGENCY plan
    const isUpdatingBranding =
      input.brandName !== undefined ||
      input.brandLogo !== undefined ||
      input.brandColor !== undefined ||
      input.customDomain !== undefined;

    if (isUpdatingBranding && !planLimit.whiteLabel) {
      throw new BadRequestException(
        'White-label branding (custom logo, brand colors, portal title) requires a TEAM or AGENCY plan tier.',
      );
    }

    const updated = await prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: {
        ...input,
      },
      create: {
        workspaceId,
        approvalRequired: input.approvalRequired ?? false,
        approvalMode: input.approvalMode ?? 'ANY_ADMIN',
        approverIds: input.approverIds ?? [],
        autoPublishAfterApproval: input.autoPublishAfterApproval ?? true,
        defaultTimezone: input.defaultTimezone ?? 'UTC',
        brandName: input.brandName,
        brandLogo: input.brandLogo,
        brandColor: input.brandColor,
        customDomain: input.customDomain,
      },
    });

    await this.auditService.log({
      action: 'WORKSPACE_SETTINGS_UPDATE',
      entityType: 'WORKSPACE_SETTINGS',
      entityId: updated.id,
      userId: operatorUserId,
      workspaceId,
      metadata: input as any,
    });

    return updated;
  }
}
