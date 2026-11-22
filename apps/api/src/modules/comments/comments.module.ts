import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { EventsService } from '../../common/services/events.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, EventsService, AuditService],
  exports: [CommentsService],
})
export class CommentsModule {}
