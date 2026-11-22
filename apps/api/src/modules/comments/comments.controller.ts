import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  CreateCommentSchema,
  UpdateCommentSchema,
} from '@orbitly/shared';

@ApiTags('Comments & Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('posts/:id')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('comments')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List threaded comments on post (Requires VIEWER)' })
  async listComments(@Param('id') postId: string): Promise<any> {
    return this.commentsService.listComments(postId);
  }

  @Post('comments')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Add a comment or reply to post with @mentions (Requires VIEWER)' })
  async createComment(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') postId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = CreateCommentSchema.parse(body);
    return this.commentsService.createComment(workspaceId, postId, user.userId, validated);
  }

  @Patch('comments/:commentId')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Edit own comment (Requires VIEWER)' })
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = UpdateCommentSchema.parse(body);
    return this.commentsService.updateComment(commentId, user.userId, validated);
  }

  @Delete('comments/:commentId')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Delete comment (Author or ADMIN)' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.commentsService.deleteComment(
      commentId,
      user.userId,
      user.role as MembershipRole,
    );
  }

  @Post('comments/:commentId/resolve')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Resolve or unresolve comment thread (Requires EDITOR)' })
  async resolveComment(@Param('commentId') commentId: string): Promise<any> {
    return this.commentsService.resolveComment(commentId);
  }

  @Get('activity')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get post activity timeline and text diffs (Requires VIEWER)' })
  async getPostActivity(@Param('id') postId: string): Promise<any> {
    return this.commentsService.getPostActivity(postId);
  }
}
