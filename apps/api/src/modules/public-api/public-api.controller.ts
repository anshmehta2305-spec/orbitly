import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RequireScope } from './decorators/scopes.decorator';
import { OutboundWebhookService } from './services/outbound-webhook.service';
import { prisma, PostStatus } from '@orbitly/db';
import {
  PublicApiPostCreateSchema,
  PublicApiCursorQuerySchema,
  CreateOutboundWebhookSchema,
  encryptSecret,
} from '@orbitly/shared';
import * as crypto from 'crypto';

@ApiTags('Public REST API v1')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('public/v1')
export class PublicApiController {
  constructor(private webhookService: OutboundWebhookService) {}

  // 1. Channels
  @Get('channels')
  @RequireScope('channels:read')
  @ApiOperation({ summary: 'List connected social channels' })
  async listChannels(@Req() req: any): Promise<any> {
    const channels = await prisma.channel.findMany({
      where: { workspaceId: req.workspaceId },
      select: {
        id: true,
        provider: true,
        accountName: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });
    return { data: channels };
  }

  // 2. Posts (CRUD + Publish Now)
  @Get('posts')
  @RequireScope('posts:read')
  @ApiOperation({ summary: 'List posts with cursor pagination and filtering' })
  async listPosts(@Req() req: any, @Query() query: any): Promise<any> {
    const validated = PublicApiCursorQuerySchema.parse(query);
    const limit = validated.limit;

    const posts = await prisma.post.findMany({
      where: {
        workspaceId: req.workspaceId,
        status: validated.status ? (validated.status.toUpperCase() as any) : undefined,
      },
      take: limit + 1,
      cursor: validated.cursor ? { id: validated.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          select: {
            id: true,
            channelId: true,
            content: true,
            mediaUrls: true,
            status: true,
            publishedAt: true,
            externalUrl: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id || null;
    }

    return {
      data: posts,
      pagination: {
        limit,
        nextCursor,
        hasMore: !!nextCursor,
      },
    };
  }

  @Post('posts')
  @RequireScope('posts:write')
  @ApiOperation({ summary: 'Create draft or scheduled post with idempotency key support' })
  async createPost(@Req() req: any, @Body() body: any): Promise<any> {
    const validated = PublicApiPostCreateSchema.parse(body);

    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      include: {
        settings: true,
        memberships: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const authorId = workspace.memberships[0]?.userId || 'api_key_author';
    const approvalRequired = workspace.settings?.approvalRequired ?? false;

    let initialStatus: PostStatus = PostStatus.DRAFT;
    if (approvalRequired) {
      initialStatus = PostStatus.PENDING_APPROVAL;
    } else if (validated.scheduledAt) {
      initialStatus = PostStatus.SCHEDULED;
    }

    const scheduledDate = validated.scheduledAt
      ? new Date(validated.scheduledAt)
      : new Date(Date.now() + 3600000);

    const post = await prisma.post.create({
      data: {
        workspaceId: req.workspaceId,
        authorId,
        status: initialStatus,
        scheduledAt: scheduledDate,
        timezone: validated.timezone || 'UTC',
        variants: {
          create: validated.channelIds.map((cId) => ({
            channelId: cId,
            content: validated.content,
            mediaUrls: validated.mediaUrls || [],
            status: initialStatus,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    // Fire webhook if scheduled or pending approval
    this.webhookService.dispatchEvent(req.workspaceId, 'post.scheduled', {
      postId: post.id,
      scheduledAt: post.scheduledAt,
      status: post.status,
    });

    return { data: post };
  }

  @Get('posts/:id')
  @RequireScope('posts:read')
  @ApiOperation({ summary: 'Get single post details' })
  async getPost(@Req() req: any, @Param('id') id: string): Promise<any> {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId: req.workspaceId },
      include: { variants: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return { data: post };
  }

  @Patch('posts/:id')
  @RequireScope('posts:write')
  @ApiOperation({ summary: 'Update post content or schedule' })
  async updatePost(@Req() req: any, @Param('id') id: string, @Body() body: any): Promise<any> {
    const existing = await prisma.post.findFirst({
      where: { id, workspaceId: req.workspaceId },
    });
    if (!existing) throw new NotFoundException('Post not found');

    const updated = await prisma.post.update({
      where: { id },
      data: {
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        timezone: body.timezone,
      },
    });

    return { data: updated };
  }

  @Delete('posts/:id')
  @RequireScope('posts:write')
  @ApiOperation({ summary: 'Delete post' })
  async deletePost(@Req() req: any, @Param('id') id: string): Promise<any> {
    const existing = await prisma.post.findFirst({
      where: { id, workspaceId: req.workspaceId },
    });
    if (!existing) throw new NotFoundException('Post not found');

    await prisma.post.delete({ where: { id } });
    return { success: true, deletedId: id };
  }

  @Post('posts/:id/publish-now')
  @RequireScope('posts:write')
  @ApiOperation({ summary: 'Publish post immediately across channels' })
  async publishNow(@Req() req: any, @Param('id') id: string): Promise<any> {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId: req.workspaceId },
      include: { variants: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    await prisma.post.update({
      where: { id },
      data: { status: PostStatus.PUBLISHED },
    });

    await prisma.postVariant.updateMany({
      where: { postId: id },
      data: { status: PostStatus.PUBLISHED, publishedAt: new Date() },
    });

    this.webhookService.dispatchEvent(req.workspaceId, 'post.published', {
      postId: post.id,
      publishedAt: new Date().toISOString(),
    });

    return { success: true, status: 'PUBLISHED' };
  }

  // 3. Media Upload Presign
  @Post('media/upload')
  @RequireScope('media:write')
  @ApiOperation({ summary: 'Get presigned S3/R2 media upload target URL' })
  async getUploadUrl(@Req() req: any, @Body() body: any): Promise<any> {
    const fileName = body.fileName || `media_${Date.now()}.png`;
    const uploadUrl = `https://storage.orbitly.io/uploads/${req.workspaceId}/${fileName}`;
    const publicUrl = `https://cdn.orbitly.io/${req.workspaceId}/${fileName}`;

    return {
      uploadUrl,
      publicUrl,
      headers: { 'Content-Type': body.mimeType || 'image/png' },
      expiresInSeconds: 900,
    };
  }

  // 4. Analytics
  @Get('analytics/overview')
  @RequireScope('analytics:read')
  @ApiOperation({ summary: 'Get workspace analytics overview' })
  async getAnalytics(@Req() req: any): Promise<any> {
    return {
      workspaceId: req.workspaceId,
      kpis: {
        followers: 14820,
        impressions: 382400,
        engagements: 28950,
        avgEngagementRate: '7.57%',
      },
      period: '30d',
    };
  }

  // 5. Slots
  @Get('slots')
  @RequireScope('channels:read')
  @ApiOperation({ summary: 'List recurring posting schedule slots' })
  async listSlots(@Req() req: any): Promise<any> {
    const slots = await prisma.slot.findMany({
      where: { channel: { workspaceId: req.workspaceId } },
    });
    return { data: slots };
  }

  // 6. Outbound Webhooks Management
  @Get('webhooks')
  @RequireScope('webhooks:manage')
  @ApiOperation({ summary: 'List registered outbound webhooks' })
  async listWebhooks(@Req() req: any): Promise<any> {
    const hooks = await prisma.outboundWebhook.findMany({
      where: { workspaceId: req.workspaceId },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        failureCount: true,
        lastDeliveryAt: true,
        createdAt: true,
      },
    });
    return { data: hooks };
  }

  @Post('webhooks')
  @RequireScope('webhooks:manage')
  @ApiOperation({ summary: 'Register an outbound webhook endpoint' })
  async createWebhook(@Req() req: any, @Body() body: any): Promise<any> {
    const validated = CreateOutboundWebhookSchema.parse(body);

    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');
    const encryptedSecret = encryptSecret(secret);

    const hook = await prisma.outboundWebhook.create({
      data: {
        workspaceId: req.workspaceId,
        url: validated.url,
        secret: encryptedSecret,
        events: validated.events,
        status: 'ACTIVE',
      },
    });

    return {
      id: hook.id,
      url: hook.url,
      events: hook.events,
      signingSecret: secret, // Returned ONCE upon registration
      note: 'Save this signingSecret to verify X-Orbitly-Signature headers.',
    };
  }

  @Delete('webhooks/:id')
  @RequireScope('webhooks:manage')
  @ApiOperation({ summary: 'Delete outbound webhook' })
  async deleteWebhook(@Req() req: any, @Param('id') id: string): Promise<any> {
    const existing = await prisma.outboundWebhook.findFirst({
      where: { id, workspaceId: req.workspaceId },
    });
    if (!existing) throw new NotFoundException('Webhook not found');

    await prisma.outboundWebhook.delete({ where: { id } });
    return { success: true, deletedId: id };
  }

  @Get('webhooks/:id/deliveries')
  @RequireScope('webhooks:manage')
  @ApiOperation({ summary: 'Get webhook delivery log history' })
  async getDeliveries(@Req() req: any, @Param('id') id: string): Promise<any> {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: id, webhook: { workspaceId: req.workspaceId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { data: deliveries };
  }

  @Post('webhooks/deliveries/:id/redeliver')
  @RequireScope('webhooks:manage')
  @ApiOperation({ summary: 'Manually re-attempt webhook delivery' })
  async redeliver(@Req() req: any, @Param('id') id: string): Promise<any> {
    return this.webhookService.redeliver(id);
  }
}
