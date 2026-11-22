import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { QueueService } from '../../common/services/queue.service';
import { EventsService } from '../../common/services/events.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [ApprovalsController],
  providers: [ApprovalsService, QueueService, EventsService, AuditService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
