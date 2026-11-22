import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { ProviderRegistry } from '../../providers/registry';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService, ProviderRegistry, AuditService],
  exports: [ChannelsService, ProviderRegistry],
})
export class ChannelsModule {}
