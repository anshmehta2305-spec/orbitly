import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuditService],
  exports: [AuthService],
})
export class AuthModule {}
