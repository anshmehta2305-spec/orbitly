import { Controller, Post, Param, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InboundWebhooksService } from './inbound-webhooks.service';
import { InboundWebhookPayloadSchema } from '@orbitly/shared';

@ApiTags('Public Webhooks')
@Controller('public')
export class PublicHooksController {
  constructor(private inboundsService: InboundWebhooksService) {}

  @Post('hooks/:token')
  @ApiOperation({ summary: 'Public inbound webhook listener for Orbitly automations' })
  async handleInbound(
    @Param('token') token: string,
    @Headers('x-orbitly-signature') signature: string,
    @Headers('x-orbitly-timestamp') timestamp: string,
    @Body() body: any,
  ) {
    const validated = InboundWebhookPayloadSchema.parse(body);
    return this.inboundsService.handleInbound(
      token,
      signature,
      timestamp,
      JSON.stringify(body),
      validated,
    );
  }
}
