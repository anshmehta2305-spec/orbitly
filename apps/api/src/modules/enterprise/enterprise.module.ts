import { Module } from '@nestjs/common';
import { SsoService } from './sso/sso.service';
import { SsoController } from './sso/sso.controller';
import { ScimService } from './scim/scim.service';
import { ScimController } from './scim/scim.controller';
import { SiemExportService } from './audit-siem/siem-export.service';
import { SiemExportController } from './audit-siem/siem-export.controller';
import { BackupVerificationService } from './compliance/backup-verification.service';
import { DataPruningService } from './compliance/data-pruning.service';
import { GdprComplianceService } from './compliance/gdpr-compliance.service';
import { ComplianceController } from './compliance/compliance.controller';
import { DataResidencyService } from './residency/data-residency.service';
import { DataResidencyController } from './residency/data-residency.controller';
import { DataResidencyGuard } from './guards/data-residency.guard';
import { EnterpriseBrandingService } from './branding/enterprise-branding.service';
import { EnterpriseBrandingController } from './branding/enterprise-branding.controller';
import { SessionTimeoutGuard } from './guards/session-timeout.guard';
import { IpAllowlistGuard } from './guards/ip-allowlist.guard';

@Module({
  controllers: [
    SsoController,
    ScimController,
    SiemExportController,
    ComplianceController,
    DataResidencyController,
    EnterpriseBrandingController,
  ],
  providers: [
    SsoService,
    ScimService,
    SiemExportService,
    BackupVerificationService,
    DataPruningService,
    GdprComplianceService,
    DataResidencyService,
    EnterpriseBrandingService,
    DataResidencyGuard,
    SessionTimeoutGuard,
    IpAllowlistGuard,
  ],
  exports: [
    SsoService,
    ScimService,
    SiemExportService,
    BackupVerificationService,
    DataPruningService,
    GdprComplianceService,
    DataResidencyService,
    EnterpriseBrandingService,
    DataResidencyGuard,
    SessionTimeoutGuard,
    IpAllowlistGuard,
  ],
})
export class EnterpriseModule {}
