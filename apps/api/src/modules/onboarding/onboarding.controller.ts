import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../admin/guards/platform-admin.guard';

@ApiTags('Onboarding & Activation')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user onboarding checklist progress and A/B variant' })
  async getState(@Req() req: any, @Query('workspaceId') workspaceId?: string) {
    return this.onboardingService.getOnboardingState(req.user.id, workspaceId);
  }

  @Post('dismiss')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dismiss the onboarding checklist from dashboard' })
  async dismiss(@Req() req: any) {
    return this.onboardingService.dismiss(req.user.id);
  }

  @Post('step')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark an onboarding checklist milestone as completed' })
  async completeStep(@Req() req: any, @Body('stepId') stepId: string) {
    return this.onboardingService.completeStep(req.user.id, stepId);
  }

  @Post('funnel-event')
  @ApiOperation({ summary: 'Record privacy-friendly lifecycle funnel milestone' })
  async trackFunnel(@Body() body: any, @Req() req: any): Promise<any> {
    const userId = req.user?.id || body.userId;
    return this.onboardingService.trackFunnelEvent({
      eventName: body.eventName,
      userId,
      workspaceId: body.workspaceId,
      properties: body.properties,
    });
  }

  @Get('admin/funnel')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Internal admin funnel conversion and A/B test telemetry' })
  async getAdminFunnel() {
    return this.onboardingService.getFunnelStats();
  }
}
