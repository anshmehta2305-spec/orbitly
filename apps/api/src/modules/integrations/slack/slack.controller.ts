import { Controller, Post, Body, Req, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SlackService } from './slack.service';

@ApiTags('Slack Integration Bot')
@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('commands')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming Slack slash commands (/orbitly schedule, /orbitly queue)' })
  async handleCommands(
    @Req() req: any,
    @Body() body: any,
    @Headers('x-slack-signature') signature?: string,
    @Headers('x-slack-request-timestamp') timestamp?: string,
  ) {
    // In production with signing secret, signature verification is checked
    if (signature && timestamp) {
      const rawBody = req.rawBody || JSON.stringify(body);
      const valid = this.slackService.verifySlackSignature(signature, Number(timestamp), rawBody);
      if (!valid) {
        throw new UnauthorizedException('Invalid Slack request signature');
      }
    }

    const command = body.command || '/orbitly';
    const text = body.text || '';
    const userId = body.user_id || 'U_SLACK_USER';
    const userName = body.user_name || 'Slack User';
    const channelId = body.channel_id || 'C_GENERAL';
    const workspaceId = req.headers['x-workspace-id'] || 'ws_demo_1';

    return this.slackService.handleSlashCommand(command, text, {
      userId,
      userName,
      channelId,
      workspaceId,
    });
  }

  @Post('interactive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Slack interactive actions (Approve, Reject, Retry)' })
  async handleInteractive(
    @Req() req: any,
    @Body() body: any,
    @Headers('x-slack-signature') signature?: string,
    @Headers('x-slack-request-timestamp') timestamp?: string,
  ) {
    if (signature && timestamp) {
      const rawBody = req.rawBody || JSON.stringify(body);
      const valid = this.slackService.verifySlackSignature(signature, Number(timestamp), rawBody);
      if (!valid) {
        throw new UnauthorizedException('Invalid Slack request signature');
      }
    }

    let payload = body;
    if (typeof body.payload === 'string') {
      try {
        payload = JSON.parse(body.payload);
      } catch {
        // Fall back
      }
    }

    const action = payload.actions?.[0];
    const actionId = action?.action_id || 'unknown_action';
    const value = action?.value || '';
    const userId = payload.user?.id || 'U_SLACK_USER';

    return this.slackService.handleInteractive(actionId, value, userId);
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Slack Event Subscriptions & Challenge verification' })
  async handleEvents(@Body() body: any) {
    // Handle Slack URL verification challenge
    if (body.type === 'url_verification') {
      return { challenge: body.challenge };
    }

    return { ok: true };
  }

  @Post('test-notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test send Slack notification' })
  async testNotify(@Body() body: { type: 'post_failed' | 'approval_requested' | 'weekly_digest'; payload: any; webhookUrl?: string }) {
    return this.slackService.sendNotification(body.type, body.payload, body.webhookUrl);
  }
}
