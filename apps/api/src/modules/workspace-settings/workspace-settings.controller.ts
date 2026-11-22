import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspaceSettingsService } from './workspace-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  UpdateWorkspaceSettingsSchema,
} from '@orbitly/shared';

@ApiTags('Workspace Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('workspace/settings')
export class WorkspaceSettingsController {
  constructor(private settingsService: WorkspaceSettingsService) {}

  @Get()
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get workspace settings, approval rules, and branding (Requires VIEWER)' })
  async getSettings(@Headers('x-workspace-id') workspaceId: string): Promise<any> {
    return this.settingsService.getSettings(workspaceId);
  }

  @Patch()
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Update workspace approval rules and branding (Requires ADMIN)' })
  async updateSettings(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = UpdateWorkspaceSettingsSchema.parse(body);
    return this.settingsService.updateSettings(workspaceId, user.userId, validated);
  }
}
