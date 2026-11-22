import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateWorkspaceSchema,
  RenameWorkspaceSchema,
  InviteMemberSchema,
  AcceptInviteSchema,
  MembershipRole,
} from '@orbitly/shared';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List all workspaces the authenticated user belongs to' })
  async listWorkspaces(@CurrentUser() user: any) {
    return this.workspacesService.listUserWorkspaces(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  async createWorkspace(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateWorkspaceSchema.parse(body);
    return this.workspacesService.createWorkspace(user.userId, validated);
  }

  @Patch(':id')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Rename workspace (Requires ADMIN)' })
  async renameWorkspace(
    @Param('id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = RenameWorkspaceSchema.parse(body);
    return this.workspacesService.renameWorkspace(workspaceId, user.userId, validated);
  }

  @Post(':id/invites')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Invite a new team member by email (Requires ADMIN)' })
  async inviteMember(
    @Param('id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = InviteMemberSchema.parse(body);
    return this.workspacesService.inviteMember(workspaceId, user.userId, validated);
  }

  @Post('invites/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation using an invitation token' })
  async acceptInvite(@CurrentUser() user: any, @Body() body: any) {
    const validated = AcceptInviteSchema.parse(body);
    return this.workspacesService.acceptInvitation(validated.token, user.userId);
  }

  @Get(':id/members')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List active members and pending invitations' })
  async listMembers(@Param('id') workspaceId: string) {
    return this.workspacesService.listMembers(workspaceId);
  }
}
