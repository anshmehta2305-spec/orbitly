import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  UpdateMemberRoleSchema,
  TransferOwnershipSchema,
} from '@orbitly/shared';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List workspace members, roles, channel access, and seat usage' })
  async listMembers(@Headers('x-workspace-id') workspaceId: string): Promise<any> {
    return this.membersService.listMembers(workspaceId);
  }

  @Patch(':id')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Update a member role or channel access (Requires ADMIN)' })
  async updateRole(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') memberId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = UpdateMemberRoleSchema.parse(body);
    return this.membersService.updateMemberRole(workspaceId, memberId, user.userId, validated);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Remove a member from the workspace (Requires ADMIN)' })
  async removeMember(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') memberId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.membersService.removeMember(workspaceId, memberId, user.userId);
  }

  @Post('transfer-ownership')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.OWNER)
  @ApiOperation({ summary: 'Transfer workspace ownership to another member (Requires OWNER)' })
  async transferOwnership(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = TransferOwnershipSchema.parse(body);
    return this.membersService.transferOwnership(workspaceId, user.userId, validated);
  }
}
