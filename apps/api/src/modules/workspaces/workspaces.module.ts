import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, AuditService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
