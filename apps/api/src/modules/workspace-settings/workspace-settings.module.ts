import { Module } from '@nestjs/common';
import { WorkspaceSettingsService } from './workspace-settings.service';
import { WorkspaceSettingsController } from './workspace-settings.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [WorkspaceSettingsController],
  providers: [WorkspaceSettingsService, AuditService],
  exports: [WorkspaceSettingsService],
})
export class WorkspaceSettingsModule {}
