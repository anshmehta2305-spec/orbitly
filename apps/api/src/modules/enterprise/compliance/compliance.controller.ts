import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BackupVerificationService } from './backup-verification.service';
import { DataPruningService } from './data-pruning.service';
import { GdprComplianceService } from './gdpr-compliance.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { prisma } from '@orbitly/db';
import {
  Soc2ComplianceSettingsSchema,
  DataRetentionPolicySchema,
  DataExportRequestSchema,
  RightToBeForgottenSchema,
} from '@orbitly/shared';

@ApiTags('Enterprise Compliance & Data Governance')
@Controller('enterprise/compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(
    private readonly backupService: BackupVerificationService,
    private readonly pruningService: DataPruningService,
    private readonly gdprService: GdprComplianceService,
  ) {}

  @Get('backup-status')
  @ApiOperation({ summary: 'SOC 2 daily backup integrity & RPO verification status' })
  async getBackupStatus() {
    return this.backupService.getLatestBackupStatus();
  }

  @Post('verify-backup-now')
  @ApiOperation({ summary: 'Trigger on-demand automated backup verification' })
  async triggerBackupCheck() {
    return this.backupService.runDailyBackupVerification();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get workspace compliance settings (session timeout & IP allowlist)' })
  async getSettings(@Req() req: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
      select: {
        sessionTimeoutMinutes: true,
        ipAllowlist: true,
        enforceSso: true,
        analyticsRetentionDays: true,
        auditLogRetentionDays: true,
        deletedPostRetentionDays: true,
        legalHold: true,
      },
    });

    return settings || {
      sessionTimeoutMinutes: 480,
      ipAllowlist: [],
      enforceSso: false,
      analyticsRetentionDays: 365,
      auditLogRetentionDays: 365,
      deletedPostRetentionDays: 30,
      legalHold: false,
    };
  }

  @Post('settings')
  @ApiOperation({ summary: 'Update session timeout (15m, 1h, 8h) and IP allowlist' })
  async updateSettings(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const parsed = Soc2ComplianceSettingsSchema.parse(body);

    const updated = await prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: {
        sessionTimeoutMinutes: Number(parsed.sessionTimeoutMinutes),
        ipAllowlist: parsed.ipAllowlist,
        enforceSso: parsed.enforceSso,
      },
      create: {
        workspaceId,
        sessionTimeoutMinutes: Number(parsed.sessionTimeoutMinutes),
        ipAllowlist: parsed.ipAllowlist,
        enforceSso: parsed.enforceSso,
      },
    });

    return {
      sessionTimeoutMinutes: updated.sessionTimeoutMinutes,
      ipAllowlist: updated.ipAllowlist,
      enforceSso: updated.enforceSso,
    };
  }

  @Post('retention')
  @ApiOperation({ summary: 'Update data retention thresholds and legal hold status' })
  async updateRetention(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const validated = DataRetentionPolicySchema.parse(body);
    return this.pruningService.updateRetentionPolicy(workspaceId, validated);
  }

  @Post('prune-now')
  @ApiOperation({ summary: 'Run on-demand data pruning according to retention policy' })
  async pruneNow(@Req() req: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    return this.pruningService.pruneWorkspaceData(workspaceId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Request GDPR/CCPA machine-readable workspace data export' })
  async requestExport(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const userId = req.user?.id || 'usr_export_req';
    const validated = DataExportRequestSchema.parse(body);
    return this.gdprService.requestDataExport(workspaceId, userId, validated.format);
  }

  @Post('erasure')
  @ApiOperation({ summary: 'GDPR Article 17 Right to be Forgotten erasure pipeline' })
  async requestErasure(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id || req.user?.userId;
    const validated = RightToBeForgottenSchema.parse(body);
    return this.gdprService.processRightToBeForgotten(userId, validated.confirmEmail, validated.reason);
  }
}
