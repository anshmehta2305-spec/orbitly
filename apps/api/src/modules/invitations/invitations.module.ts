import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, AuditService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
