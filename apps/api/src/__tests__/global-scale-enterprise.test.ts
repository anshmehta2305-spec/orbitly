import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataResidencyService } from '../modules/enterprise/residency/data-residency.service';
import { DataPruningService } from '../modules/enterprise/compliance/data-pruning.service';
import { GdprComplianceService } from '../modules/enterprise/compliance/gdpr-compliance.service';
import { EnterpriseBrandingService } from '../modules/enterprise/branding/enterprise-branding.service';
import { DataResidencyGuard } from '../modules/enterprise/guards/data-residency.guard';
import {
  getRegionalDatabaseUrl,
  getRegionalRedisConfig,
  getRegionalStorageBucket,
  getRegionalQueueName,
  validateRegionIsolation,
} from '@orbitly/shared';
import { prisma } from '@orbitly/db';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@orbitly/db', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    analyticsSnapshot: {
      deleteMany: vi.fn(),
    },
    auditLog: {
      deleteMany: vi.fn(),
    },
    post: {
      deleteMany: vi.fn(),
    },
    dataExportRequest: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    rightToBeForgottenRequest: {
      create: vi.fn(),
    },
  },
}));

describe('Increment 6: Global Scale, Multi-Region Residency & Enterprise Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Multi-Region Data Residency & Isolation', () => {
    let residencyService: DataResidencyService;

    beforeEach(() => {
      residencyService = new DataResidencyService();
    });

    it('should generate correct US regional infrastructure endpoints', () => {
      const dbUrl = getRegionalDatabaseUrl('US');
      const redis = getRegionalRedisConfig('US');
      const storage = getRegionalStorageBucket('US');
      const queue = getRegionalQueueName('publishing', 'US');

      expect(dbUrl).toContain('postgres-us.orbitly.internal:5432');
      expect(redis.host).toBe('redis-us.orbitly.internal');
      expect(redis.keyPrefix).toBe('orbitly:us:');
      expect(storage.bucket).toBe('orbitly-media-us-east-1');
      expect(queue).toBe('publishing-us-publishing');
    });

    it('should generate correct EU regional infrastructure endpoints', () => {
      const dbUrl = getRegionalDatabaseUrl('EU');
      const redis = getRegionalRedisConfig('EU');
      const storage = getRegionalStorageBucket('EU');
      const queue = getRegionalQueueName('publishing', 'EU');

      expect(dbUrl).toContain('postgres-eu.orbitly.internal:5432');
      expect(redis.host).toBe('redis-eu.orbitly.internal');
      expect(redis.keyPrefix).toBe('orbitly:eu:');
      expect(storage.bucket).toBe('orbitly-media-eu-central-1');
      expect(queue).toBe('publishing-eu-publishing');
    });

    it('should block EU customer data from routing to non-EU servers (Strict Isolation)', () => {
      const violation = validateRegionIsolation('EU', 'US');
      expect(violation.allowed).toBe(false);
      expect(violation.reason).toContain('GDPR Data Residency Violation');

      const allowedEU = validateRegionIsolation('EU', 'EU');
      expect(allowedEU.allowed).toBe(true);

      const allowedUS = validateRegionIsolation('US', 'US');
      expect(allowedUS.allowed).toBe(true);
    });

    it('should retrieve workspace residency and dedicated egress IP pools', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws_eu_corp',
        region: 'EU',
        dedicatedEgressIpPool: ['198.51.100.55', '198.51.100.56'],
      });

      const res = await residencyService.getWorkspaceRegion('ws_eu_corp');
      expect(res.region).toBe('EU');
      expect(res.endpoints.storage.bucket).toBe('orbitly-media-eu-central-1');
      expect(res.dedicatedEgressIpPool).toContain('198.51.100.55');
    });

    it('DataResidencyGuard should throw ForbiddenException when EU tenant hits US server', async () => {
      const guard = new DataResidencyGuard(residencyService);
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws_eu_tenant',
        region: 'EU',
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-workspace-id': 'ws_eu_tenant', 'x-orbitly-region': 'US' },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Data Retention Policies & Legal Hold', () => {
    let pruningService: DataPruningService;

    beforeEach(() => {
      pruningService = new DataPruningService();
    });

    it('should update retention thresholds and legal hold flag in WorkspaceSettings', async () => {
      (prisma.workspaceSettings.upsert as any).mockResolvedValue({
        workspaceId: 'ws_1',
        analyticsRetentionDays: 90,
        auditLogRetentionDays: 1825,
        deletedPostRetentionDays: 14,
        legalHold: true,
      });

      const res = await pruningService.updateRetentionPolicy('ws_1', {
        analyticsRetentionDays: 90,
        auditLogRetentionDays: 1825,
        deletedPostRetentionDays: 14,
        legalHold: true,
      });

      expect(res.legalHold).toBe(true);
      expect(res.auditLogRetentionDays).toBe(1825);
    });

    it('should freeze all pruning operations when legal hold is active', async () => {
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        workspaceId: 'ws_hold',
        legalHold: true,
        analyticsRetentionDays: 90,
        auditLogRetentionDays: 90,
        deletedPostRetentionDays: 30,
      });

      const pruneResult = await pruningService.pruneWorkspaceData('ws_hold');
      expect(pruneResult.skipped).toBe(true);
      expect(pruneResult.reason).toBe('LEGAL_HOLD_ACTIVE');

      expect(prisma.analyticsSnapshot.deleteMany).not.toHaveBeenCalled();
      expect(prisma.auditLog.deleteMany).not.toHaveBeenCalled();
      expect(prisma.post.deleteMany).not.toHaveBeenCalled();
    });

    it('should execute data pruning when legal hold is false', async () => {
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        workspaceId: 'ws_active',
        legalHold: false,
        analyticsRetentionDays: 365,
        auditLogRetentionDays: 365,
        deletedPostRetentionDays: 30,
      });

      (prisma.analyticsSnapshot.deleteMany as any).mockResolvedValue({ count: 120 });
      (prisma.auditLog.deleteMany as any).mockResolvedValue({ count: 450 });
      (prisma.post.deleteMany as any).mockResolvedValue({ count: 15 });

      const pruneResult = await pruningService.pruneWorkspaceData('ws_active');
      expect(pruneResult.skipped).toBe(false);
      expect(pruneResult.prunedAnalytics).toBe(120);
      expect(pruneResult.prunedAuditLogs).toBe(450);
      expect(pruneResult.purgedDeletedPosts).toBe(15);
    });

    it('assertNoLegalHold should throw ForbiddenException when legal hold is active', async () => {
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        legalHold: true,
      });

      await expect(pruningService.assertNoLegalHold('ws_hold')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. GDPR / CCPA Data Export & Erasure Pipeline', () => {
    let gdprService: GdprComplianceService;

    beforeEach(() => {
      gdprService = new GdprComplianceService();
    });

    it('should package machine-readable data export archive', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws_gdpr',
        name: 'Enterprise Growth Corp',
        channels: [{ id: 'c1' }, { id: 'c2' }],
        posts: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
        memberships: [{ user: { id: 'u1', name: 'John Doe', email: 'john@growth.com' } }],
      });

      (prisma.dataExportRequest.create as any).mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'export_req_101',
          ...data,
        }),
      );

      const res = await gdprService.requestDataExport('ws_gdpr', 'u1', 'JSON');
      expect(res.status).toBe('COMPLETED');
      expect(res.data.totalChannels).toBe(2);
      expect(res.data.totalPostsExported).toBe(3);
      expect(res.data.downloadUrl).toContain('/exports/ws_gdpr/export-');
      expect(prisma.dataExportRequest.create).toHaveBeenCalled();
    });

    it('should execute Right-to-be-Forgotten erasure pipeline and anonymize PII', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'usr_to_erase_99',
        email: 'privacy@user.com',
        name: 'Privacy Concerned User',
      });
      (prisma.user.update as any).mockResolvedValue({ id: 'usr_to_erase_99' });
      (prisma.session.deleteMany as any).mockResolvedValue({ count: 3 });
      (prisma.rightToBeForgottenRequest.create as any).mockResolvedValue({
        id: 'rtbf_log_1',
        anonymizedAt: new Date(),
      });

      const res = await gdprService.processRightToBeForgotten('usr_to_erase_99', 'privacy@user.com');
      expect(res.status).toBe('COMPLETED');
      expect(res.anonymizedEmail).toContain('@anonymized.orbitly.local');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr_to_erase_99' },
          data: expect.objectContaining({
            name: 'Anonymized User',
            avatar: null,
            passwordHash: null,
          }),
        }),
      );
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr_to_erase_99' } });
    });

    it('should reject erasure request if confirmation email does not match account', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'usr_1',
        email: 'real@email.com',
      });

      await expect(
        gdprService.processRightToBeForgotten('usr_1', 'wrong@email.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Enterprise Branding, SSL & SLA Dashboard', () => {
    let brandingService: EnterpriseBrandingService;

    beforeEach(() => {
      brandingService = new EnterpriseBrandingService();
    });

    it('should provision custom domain SSL certificate', async () => {
      (prisma.workspaceSettings.upsert as any).mockResolvedValue({
        customDomain: 'social.apexmarketing.com',
        customDomainSslStatus: 'ACTIVE',
        customDomainSslIssuedAt: new Date(),
      });

      const res = await brandingService.provisionCustomDomainSsl('ws_brand', 'social.apexmarketing.com');
      expect(res.customDomain).toBe('social.apexmarketing.com');
      expect(res.sslStatus).toBe('ACTIVE');
      expect(res.edgeCertificateAuthority).toContain('Cloudflare Edge TLS');
    });

    it('should verify email sender domain DKIM, SPF, and DMARC status', async () => {
      (prisma.workspaceSettings.upsert as any).mockResolvedValue({
        emailDomain: 'mail.apexmarketing.com',
        emailDkimStatus: 'VERIFIED',
        emailSpfStatus: 'VERIFIED',
        emailDmarcStatus: 'VERIFIED',
      });

      const res = await brandingService.verifyEmailSenderDomain('ws_brand', 'mail.apexmarketing.com');
      expect(res.emailDomain).toBe('mail.apexmarketing.com');
      expect(res.dkimStatus).toBe('VERIFIED');
      expect(res.spfStatus).toBe('VERIFIED');
      expect(res.dmarcStatus).toBe('VERIFIED');
      expect(res.dnsRecords).toHaveLength(3);
    });

    it('should return enterprise SLA commitments and capacity metrics', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws_enterprise_tier',
        dedicatedEgressIpPool: ['198.51.100.25', '198.51.100.26'],
        settings: {
          customDomain: 'portal.enterprise.com',
          customDomainSslStatus: 'ACTIVE',
          emailDomain: 'mail.enterprise.com',
          emailDkimStatus: 'VERIFIED',
        },
      });

      const metrics = await brandingService.getSlaDashboardMetrics('ws_enterprise_tier');
      expect(metrics.tier).toBe('ENTERPRISE');
      expect(metrics.slaCommitment.uptimePercent).toBe(99.99);
      expect(metrics.rateLimits.apiRequestsPerMinute).toBe(600);
      expect(metrics.dedicatedEgressIpPool).toContain('198.51.100.25');
    });
  });
});
