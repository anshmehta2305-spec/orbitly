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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { PostsService } from './posts.service';
import { EventsService } from '../../common/services/events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePostSchema,
  UpdatePostSchema,
  PostFilterSchema,
  BulkPostActionSchema,
  MembershipRole,
} from '@orbitly/shared';

@ApiTags('Posts & Calendar')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events/stream')
  @ApiOperation({ summary: 'Server-Sent Events (SSE) stream for live calendar & status updates' })
  streamEvents(@Query('workspaceId') workspaceId: string): Observable<MessageEvent> {
    return this.eventsService.getEventStream(workspaceId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Create new post with multiple channel variants' })
  async createPost(@CurrentUser() user: any, @Body() body: any): Promise<any> {
    const validated = CreatePostSchema.parse(body);
    return this.postsService.createPost(user.userId, validated);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List posts with range, channel, status, tag filters' })
  async listPosts(@Query() query: any): Promise<any> {
    const validated = PostFilterSchema.parse(query);
    return this.postsService.listPosts(validated);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get single post details with variants and comments' })
  async getPost(@Query('workspaceId') workspaceId: string, @Param('id') id: string): Promise<any> {
    return this.postsService.getPost(workspaceId, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Update post or variants (reschedules if scheduledAt changed)' })
  async updatePost(
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = UpdatePostSchema.parse(body);
    return this.postsService.updatePost(workspaceId, id, validated);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Cancel/Delete post and remove delayed queue jobs' })
  async deletePost(@Query('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.postsService.deletePost(workspaceId, id);
  }

  @Post(':id/publish-now')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Trigger immediate publication for a post' })
  async publishNow(@Query('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.postsService.publishNow(workspaceId, id);
  }

  @Post(':id/duplicate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Duplicate an existing post as a draft' })
  async duplicatePost(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ): Promise<any> {
    return this.postsService.duplicatePost(user.userId, workspaceId, id);
  }

  @Post(':id/retry')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Retry failed variant(s) of a post' })
  async retryPost(@Query('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.postsService.retryPost(workspaceId, id);
  }

  @Post('bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Bulk action (reschedule, delete, or change status)' })
  async bulkAction(@Body() body: any) {
    const validated = BulkPostActionSchema.parse(body);
    return this.postsService.bulkAction(validated);
  }

  @Post('import-csv/validate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Validate CSV rows for bulk post scheduling' })
  async validateCsv(@Query('workspaceId') workspaceId: string, @Body() body: { rows: any[] }) {
    return this.postsService.validateCsv(workspaceId, body.rows || []);
  }

  @Post('import-csv/commit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Commit valid CSV rows into scheduled posts' })
  async commitCsv(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Body() body: { rows: any[] },
  ) {
    return this.postsService.commitCsv(user.userId, workspaceId, body.rows || []);
  }
}
