import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UpdateUserAdminSchema,
  OverrideWorkspacePlanSchema,
  CreateFeatureFlagSchema,
  CreateAnnouncementSchema,
} from '@orbitly/shared';

@ApiTags('Admin Panel (Platform)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform KPI overview (Signups, MRR, Active Workspaces, Queue Depth)' })
  async getOverview(): Promise<any> {
    return this.adminService.getOverviewStats();
  }

  // Users
  @Get('users')
  @ApiOperation({ summary: 'List and search platform users' })
  async getUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<any> {
    return this.adminService.getUsers(search, limit, offset);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user account (disable/enable, verify email, platform role)' })
  async updateUser(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = UpdateUserAdminSchema.parse(body);
    return this.adminService.updateUser(id, validated, admin.userId);
  }

  @Post('users/:id/impersonate')
  @ApiOperation({ summary: 'Generate time-limited impersonation session token (Support & Superadmin only)' })
  async impersonateUser(
    @Param('id') targetUserId: string,
    @CurrentUser() admin: any,
  ): Promise<any> {
    return this.adminService.impersonateUser(admin.userId, targetUserId);
  }

  // Workspaces & Comp Accounts
  @Get('workspaces')
  @ApiOperation({ summary: 'List workspaces with plan, member, and channel counts' })
  async getWorkspaces(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<any> {
    return this.adminService.getWorkspaces(search, limit, offset);
  }

  @Post('workspaces/:id/override-plan')
  @ApiOperation({ summary: 'Manually override workspace plan tier (comp accounts)' })
  async overridePlan(
    @Param('id') workspaceId: string,
    @CurrentUser() admin: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = OverrideWorkspacePlanSchema.parse(body);
    return this.adminService.overrideWorkspacePlan(
      workspaceId,
      validated.planTier,
      validated.expiresAt,
      validated.note,
      admin.userId,
    );
  }

  // Feature Flags
  @Get('feature-flags')
  @ApiOperation({ summary: 'List platform feature flags' })
  async getFeatureFlags(): Promise<any> {
    return this.adminService.getFeatureFlags();
  }

  @Post('feature-flags')
  @ApiOperation({ summary: 'Create feature flag' })
  async createFeatureFlag(@Body() body: any): Promise<any> {
    const validated = CreateFeatureFlagSchema.parse(body);
    return this.adminService.createFeatureFlag(validated);
  }

  @Patch('feature-flags/:key')
  @ApiOperation({ summary: 'Toggle feature flag state' })
  async toggleFeatureFlag(
    @Param('key') key: string,
    @Body() body: { isEnabled: boolean },
  ): Promise<any> {
    return this.adminService.toggleFeatureFlag(key, body.isEnabled);
  }

  // Announcements
  @Get('announcements')
  @ApiOperation({ summary: 'List active announcements' })
  async getAnnouncements(): Promise<any> {
    return this.adminService.getAnnouncements();
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create platform-wide banner announcement' })
  async createAnnouncement(@Body() body: any): Promise<any> {
    const validated = CreateAnnouncementSchema.parse(body);
    return this.adminService.createAnnouncement(validated);
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: 'Delete announcement banner' })
  async deleteAnnouncement(@Param('id') id: string): Promise<any> {
    return this.adminService.deleteAnnouncement(id);
  }

  // Audit Logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Search and filter platform audit logs' })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<any> {
    return this.adminService.getAuditLogs(action, limit, offset);
  }
}
