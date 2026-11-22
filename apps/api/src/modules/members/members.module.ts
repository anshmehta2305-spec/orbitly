import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, AuditService],
  exports: [MembersService],
})
export class MembersModule {}
