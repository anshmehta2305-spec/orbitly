import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { DeveloperSettingsController } from './developer-settings.controller';
import { OpenApiController } from './openapi.controller';
import { OutboundWebhookService } from './services/outbound-webhook.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  controllers: [PublicApiController, DeveloperSettingsController, OpenApiController],
  providers: [OutboundWebhookService, ApiKeyGuard],
  exports: [OutboundWebhookService],
})
export class PublicApiModule {}
