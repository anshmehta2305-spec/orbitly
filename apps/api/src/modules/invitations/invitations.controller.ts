import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  CreateInvitationSchema,
  BulkInvitationSchema,
  AcceptInvitationSchema,
} from '@orbitly/shared';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Send a workspace invitation by email (Requires ADMIN)' })
  async createInvitation(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = CreateInvitationSchema.parse(body);
    return this.invitationsService.createInvitation(workspaceId, user.userId, validated);
  }

  @Post('bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Bulk invite multiple emails (Requires ADMIN)' })
  async bulkInvite(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = BulkInvitationSchema.parse(body);
    return this.invitationsService.createBulkInvitations(workspaceId, user.userId, validated);
  }

  @Post(':id/resend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Resend an active invitation with refreshed 7-day expiry (Requires ADMIN)' })
  async resendInvitation(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') invitationId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.invitationsService.resendInvitation(workspaceId, invitationId, user.userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Revoke a pending invitation (Requires ADMIN)' })
  async revokeInvitation(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') invitationId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.invitationsService.revokeInvitation(workspaceId, invitationId, user.userId);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept invitation (handles new and existing users)' })
  async acceptInvitation(
    @Body() body: any,
    @CurrentUser() user?: any,
  ): Promise<any> {
    const validated = AcceptInvitationSchema.parse(body);
    return this.invitationsService.acceptInvitation(validated, user?.userId);
  }
}
