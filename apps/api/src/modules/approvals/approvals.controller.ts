import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  SubmitForApprovalSchema,
  ApprovePostSchema,
  RequestChangesSchema,
  RejectPostSchema,
  BulkApproveSchema,
} from '@orbitly/shared';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller()
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Post('posts/:id/submit')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Submit post for workspace approval (Requires EDITOR)' })
  async submitForApproval(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') postId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = SubmitForApprovalSchema.parse(body);
    return this.approvalsService.submitForApproval(workspaceId, postId, user.userId, validated);
  }

  @Post('posts/:id/approve')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Approve a pending post (Requires ADMIN)' })
  async approvePost(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') postId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = ApprovePostSchema.parse(body);
    return this.approvalsService.approvePost(
      workspaceId,
      postId,
      user.userId,
      user.role as MembershipRole,
      validated,
    );
  }

  @Post('posts/:id/request-changes')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Request changes on a pending post (Requires ADMIN)' })
  async requestChanges(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') postId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = RequestChangesSchema.parse(body);
    return this.approvalsService.requestChanges(
      workspaceId,
      postId,
      user.userId,
      user.role as MembershipRole,
      validated,
    );
  }

  @Post('posts/:id/reject')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Reject a pending post (Requires ADMIN)' })
  async rejectPost(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') postId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = RejectPostSchema.parse(body);
    return this.approvalsService.rejectPost(
      workspaceId,
      postId,
      user.userId,
      user.role as MembershipRole,
      validated,
    );
  }

  @Get('approvals')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List pending approvals in workspace inbox (Requires VIEWER)' })
  async getInbox(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('channelId') channelId?: string,
    @Query('authorId') authorId?: string,
  ): Promise<any> {
    return this.approvalsService.getApprovalsInbox(workspaceId, { channelId, authorId });
  }

  @Post('approvals/bulk-approve')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Bulk approve pending posts (Requires ADMIN)' })
  async bulkApprove(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = BulkApproveSchema.parse(body);
    return this.approvalsService.bulkApprove(
      workspaceId,
      user.userId,
      user.role as MembershipRole,
      validated,
    );
  }
}
