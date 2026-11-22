import { Module } from '@nestjs/common';
import { LifecycleEmailService } from './lifecycle-email.service';
import { EmailPreferenceController } from './email-preference.controller';

@Module({
  controllers: [EmailPreferenceController],
  providers: [LifecycleEmailService],
  exports: [LifecycleEmailService],
})
export class LifecycleEmailModule {}
