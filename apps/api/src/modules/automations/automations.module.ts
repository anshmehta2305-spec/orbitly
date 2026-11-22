import { Module } from '@nestjs/common';
import { AutomationsController } from './automations.controller';
import { PublicHooksController } from './public-hooks.controller';
import { AutomationsService } from './automations.service';
import { InboundWebhooksService } from './inbound-webhooks.service';

@Module({
  controllers: [AutomationsController, PublicHooksController],
  providers: [AutomationsService, InboundWebhooksService],
  exports: [AutomationsService, InboundWebhooksService],
})
export class AutomationsModule {}
