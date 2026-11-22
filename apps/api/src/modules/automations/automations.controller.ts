import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutomationsService } from './automations.service';
import { InboundWebhooksService } from './inbound-webhooks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import {
  MembershipRole,
  CreateAutomationSchema,
  UpdateAutomationSchema,
  DryRunAutomationSchema,
} from '@orbitly/shared';

@ApiTags('Automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller()
export class AutomationsController {
  constructor(
    private automationsService: AutomationsService,
    private inboundsService: InboundWebhooksService,
  ) {}

  @Get('automations')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List workspace automations' })
  async getAutomations(@Headers('x-workspace-id') workspaceId: string): Promise<any> {
    return this.automationsService.getAutomations(workspaceId);
  }

  @Post('automations')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Create new automation rule' })
  async createAutomation(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = CreateAutomationSchema.parse(body);
    return this.automationsService.createAutomation(workspaceId, validated);
  }

  @Patch('automations/:id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Update automation rule' })
  async updateAutomation(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = UpdateAutomationSchema.parse(body);
    return this.automationsService.updateAutomation(workspaceId, id, validated);
  }

  @Delete('automations/:id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Delete automation' })
  async deleteAutomation(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ): Promise<any> {
    return this.automationsService.deleteAutomation(workspaceId, id);
  }

  @Post('automations/:id/pause')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Pause an active automation' })
  async pauseAutomation(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ): Promise<any> {
    return this.automationsService.pauseAutomation(workspaceId, id);
  }

  @Post('automations/:id/resume')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Resume a paused automation' })
  async resumeAutomation(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ): Promise<any> {
    return this.automationsService.resumeAutomation(workspaceId, id);
  }

  @Post('automations/:id/run-now')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Manually trigger an automation execution right now' })
  async runNow(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.automationsService.runNow(workspaceId, id);
  }

  @Post('automations/dry-run')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Preview next scheduled outputs for an automation' })
  async dryRun(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: any,
  ) {
    const validated = DryRunAutomationSchema.parse(body);
    return this.automationsService.dryRun(workspaceId, validated);
  }

  @Get('automations/:id/runs')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get execution history of an automation' })
  async getRuns(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.automationsService.getRuns(workspaceId, id, limit, offset);
  }

  // Inbound Webhooks Endpoints Management
  @Get('inbound-webhooks')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List workspace inbound webhook endpoints' })
  async getInboundEndpoints(@Headers('x-workspace-id') workspaceId: string) {
    return this.inboundsService.getEndpoints(workspaceId);
  }

  @Post('inbound-webhooks')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Generate a new inbound webhook endpoint' })
  async createInboundEndpoint(@Headers('x-workspace-id') workspaceId: string) {
    return this.inboundsService.createEndpoint(workspaceId);
  }

  @Post('inbound-webhooks/:id/rotate')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Rotate webhook signing secret' })
  async rotateSecret(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.inboundsService.rotateSecret(workspaceId, id);
  }

  @Delete('inbound-webhooks/:id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Delete an inbound webhook endpoint' })
  async deleteInboundEndpoint(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.inboundsService.deleteEndpoint(workspaceId, id);
  }
}
