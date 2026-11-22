import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@orbitly/db';
import {
  CreatePostInput,
  UpdatePostInput,
  PostFilterInput,
  BulkPostActionInput,
  CsvRowInput,
  PostStatus,
  PlanTier,
  PLAN_LIMITS,
  computePostStatusRollup,
  normalizePayload,
  localToUtc,
  checkReApprovalOnEdit,
  detectPostChanges,
} from '@orbitly/shared';
import { QueueService } from '../../common/services/queue.service';
import { EventsService } from '../../common/services/events.service';
import { AuditService } from '../../common/services/audit.service';
import { ProviderRegistry } from '../../providers/registry';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly eventsService: EventsService,
    private readonly providerRegistry: ProviderRegistry,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Checks workspace plan limits for monthly posts
   */
  private async checkPlanPostLimit(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const tier = (workspace.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const limit = PLAN_LIMITS[tier].maxPostsPerMonth;

    if (limit === Infinity) return;

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const postCount = await prisma.post.count({
      where: {
        workspaceId,
        createdAt: { gte: startOfMonth },
        status: { notIn: [PostStatus.DRAFT, PostStatus.CANCELLED] },
      },
    });

    if (postCount >= limit) {
      throw new ForbiddenException(
        `Monthly post limit of ${limit} posts reached on the ${tier} plan. Please upgrade to schedule more posts.`,
      );
    }
  }

  /**
   * Create Post with Channel Variants
   */
  async createPost(userId: string, input: CreatePostInput): Promise<any> {
    if (!input.postNow && input.scheduledAt) {
      await this.checkPlanPostLimit(input.workspaceId);
    }

    // Determine initial post status
    let initialStatus: PostStatus = PostStatus.DRAFT;
    let scheduledDate: Date | null = null;

    if (input.postNow) {
      initialStatus = PostStatus.PUBLISHING;
      scheduledDate = new Date();
    } else if (input.submitForApproval) {
      initialStatus = PostStatus.PENDING_APPROVAL;
      scheduledDate = input.scheduledAt ? new Date(input.scheduledAt) : null;
    } else if (input.scheduledAt) {
      initialStatus = PostStatus.SCHEDULED;
      scheduledDate = new Date(input.scheduledAt);
    }

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Create Post & Variants in transaction
    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          workspaceId: input.workspaceId,
          authorId: userId,
          title: input.title,
          status: initialStatus,
          scheduledAt: scheduledDate,
          timezone: input.timezone || 'UTC',
          groupId,
          tags: input.tags || [],
          campaign: input.campaign,
        },
      });

      // Create variants
      const variantsData = input.variants.map((variant) => ({
        postId: newPost.id,
        channelId: variant.channelId,
        content: variant.content,
        mediaUrls: variant.mediaUrls || [],
        thread: variant.thread || [],
        firstComment: variant.firstComment,
        settings: variant.settings || {},
        status: initialStatus,
      }));

      await tx.postVariant.createMany({
        data: variantsData,
      });

      return tx.post.findUnique({
        where: { id: newPost.id },
        include: {
          variants: {
            include: { channel: true },
          },
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });
    });

    if (!post) throw new BadRequestException('Failed to create post');

    // Enqueue jobs if scheduled or post now
    if (scheduledDate) {
      for (const variant of post.variants) {
        if (input.postNow) {
          await this.queueService.publishNow(variant.id, post.id, post.workspaceId);
        } else if (initialStatus === PostStatus.SCHEDULED) {
          await this.queueService.scheduleVariant(variant.id, post.id, post.workspaceId, scheduledDate);
        }
      }
    }

    // Broadcast SSE
    this.eventsService.emit({
      type: 'POST_CREATED',
      workspaceId: post.workspaceId,
      postId: post.id,
      status: post.status,
      data: post,
    });

    return post;
  }

  /**
   * List Posts with Filtering
   */
  async listPosts(filter: PostFilterInput): Promise<any> {
    const where: any = {
      workspaceId: filter.workspaceId,
      deletedAt: null,
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.authorId) {
      where.authorId = filter.authorId;
    }

    if (filter.tag) {
      where.tags = { has: filter.tag };
    }

    if (filter.channelId) {
      where.variants = {
        some: { channelId: filter.channelId },
      };
    }

    if (filter.startDate || filter.endDate) {
      where.scheduledAt = {};
      if (filter.startDate) where.scheduledAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.scheduledAt.lte = new Date(filter.endDate);
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { variants: { some: { content: { contains: filter.search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (filter.page - 1) * filter.limit;

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: filter.limit,
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          variants: {
            include: {
              channel: {
                select: {
                  id: true,
                  provider: true,
                  accountName: true,
                  avatar: true,
                  color: true,
                  status: true,
                },
              },
            },
          },
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  /**
   * Get single Post by ID
   */
  async getPost(workspaceId: string, postId: string): Promise<any> {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId, deletedAt: null },
      include: {
        variants: {
          include: {
            channel: true,
          },
        },
        author: { select: { id: true, name: true, email: true, avatar: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        approvals: {
          include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  /**
   * Update Post
   */
  async updatePost(workspaceId: string, postId: string, input: UpdatePostInput): Promise<any> {
    const existing = await prisma.post.findFirst({
      where: { id: postId, workspaceId, deletedAt: null },
      include: { variants: true },
    });

    if (!existing) throw new NotFoundException('Post not found');

    if (existing.status === PostStatus.PUBLISHED) {
      throw new BadRequestException('Cannot edit an already published post.');
    }

    const newScheduledAt = input.scheduledAt !== undefined ? (input.scheduledAt ? new Date(input.scheduledAt) : null) : existing.scheduledAt;

    // Check workspace approval settings
    const settings = await prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    const approvalRequired = settings?.approvalRequired ?? false;

    const hasChanged = detectPostChanges(
      {
        title: existing.title,
        scheduledAt: existing.scheduledAt,
        tags: existing.tags,
        variants: existing.variants.map((v) => ({ channelId: v.channelId, content: v.content })),
      },
      {
        title: input.title !== undefined ? input.title : existing.title,
        scheduledAt: newScheduledAt,
        tags: input.tags || existing.tags,
        variants: input.variants?.map((v) => ({ channelId: v.channelId, content: v.content })),
      },
    );

    const reApproval = checkReApprovalOnEdit(
      {
        status: existing.status as any,
        approvalVersion: existing.approvalVersion,
      },
      hasChanged,
      approvalRequired,
    );

    let targetStatus = input.status || (newScheduledAt ? PostStatus.SCHEDULED : existing.status);
    let targetVersion = existing.approvalVersion;

    if (reApproval.needsReApproval) {
      targetStatus = PostStatus.DRAFT;
      targetVersion = reApproval.newVersion;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const post = await tx.post.update({
        where: { id: postId },
        data: {
          title: input.title !== undefined ? input.title : existing.title,
          scheduledAt: newScheduledAt,
          timezone: input.timezone || existing.timezone,
          tags: input.tags || existing.tags,
          campaign: input.campaign !== undefined ? input.campaign : existing.campaign,
          status: targetStatus,
          approvalVersion: targetVersion,
        },
      });

      // Update variants if provided
      if (input.variants) {
        for (const variantInput of input.variants) {
          const existingVariant = existing.variants.find((v) => v.channelId === variantInput.channelId);
          if (existingVariant) {
            await tx.postVariant.update({
              where: { id: existingVariant.id },
              data: {
                content: variantInput.content,
                mediaUrls: variantInput.mediaUrls || [],
                thread: variantInput.thread || [],
                firstComment: variantInput.firstComment,
                settings: variantInput.settings || {},
                status: post.status,
              },
            });
          }
        }
      }

      return tx.post.findUnique({
        where: { id: postId },
        include: {
          variants: { include: { channel: true } },
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });
    });

    if (!updated) throw new BadRequestException('Failed to update post');

    // Reschedule BullMQ delayed jobs
    if (newScheduledAt && updated.status === PostStatus.SCHEDULED) {
      for (const variant of updated.variants) {
        await this.queueService.scheduleVariant(variant.id, updated.id, updated.workspaceId, newScheduledAt);
      }
    } else if (!newScheduledAt || updated.status === PostStatus.DRAFT) {
      for (const variant of updated.variants) {
        await this.queueService.cancelVariantJob(variant.id);
      }
    }

    this.eventsService.emit({
      type: 'POST_UPDATED',
      workspaceId: updated.workspaceId,
      postId: updated.id,
      status: updated.status,
      data: updated,
    });

    await this.auditService.logActivity({
      workspaceId: updated.workspaceId,
      postId: updated.id,
      action: reApproval.needsReApproval ? 'POST_EDITED_REAPPROVAL_TRIGGERED' : 'POST_EDITED',
      entity: 'POST',
      entityId: updated.id,
      beforeJson: { status: existing.status, approvalVersion: existing.approvalVersion },
      afterJson: { status: updated.status, approvalVersion: updated.approvalVersion },
      diffJson: { reApprovalTriggered: reApproval.needsReApproval, hasChanged },
    });

    return updated;
  }

  /**
   * Delete / Cancel Post
   */
  async deletePost(workspaceId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId },
      include: { variants: true },
    });

    if (!post) throw new NotFoundException('Post not found');

    // Cancel all queued BullMQ jobs
    for (const variant of post.variants) {
      await this.queueService.cancelVariantJob(variant.id);
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
        status: PostStatus.CANCELLED,
      },
    });

    this.eventsService.emit({
      type: 'POST_DELETED',
      workspaceId,
      postId,
    });

    return { ok: true, message: 'Post cancelled and removed from queue.' };
  }

  /**
   * Publish Now (Immediate execution)
   */
  async publishNow(workspaceId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId, deletedAt: null },
      include: { variants: true },
    });

    if (!post) throw new NotFoundException('Post not found');

    await prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHING },
    });

    for (const variant of post.variants) {
      await prisma.postVariant.update({
        where: { id: variant.id },
        data: { status: PostStatus.PUBLISHING },
      });
      await this.queueService.publishNow(variant.id, post.id, workspaceId);
    }

    this.eventsService.emit({
      type: 'POST_STATUS_CHANGED',
      workspaceId,
      postId,
      status: PostStatus.PUBLISHING,
    });

    return { ok: true, message: 'Post enqueued for immediate publishing.' };
  }

  /**
   * Duplicate Post
   */
  async duplicatePost(userId: string, workspaceId: string, postId: string): Promise<any> {
    const original = await this.getPost(workspaceId, postId);

    return this.createPost(userId, {
      workspaceId,
      title: original.title ? `${original.title} (Copy)` : undefined,
      scheduledAt: null,
      timezone: original.timezone,
      tags: original.tags,
      campaign: original.campaign || undefined,
      postNow: false,
      submitForApproval: false,
      variants: original.variants.map((v: any) => ({
        channelId: v.channelId,
        content: v.content,
        mediaUrls: v.mediaUrls,
        thread: v.thread,
        firstComment: v.firstComment || undefined,
        settings: (v.settings as any) || {},
      })),
    });
  }

  /**
   * Retry Failed Post Variants
   */
  async retryPost(workspaceId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId },
      include: { variants: true },
    });

    if (!post) throw new NotFoundException('Post not found');

    const failedVariants = post.variants.filter(
      (v) => v.status === PostStatus.FAILED || v.status === PostStatus.DRAFT,
    );

    if (failedVariants.length === 0) {
      throw new BadRequestException('No failed variants available to retry.');
    }

    await prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHING },
    });

    for (const variant of failedVariants) {
      await prisma.postVariant.update({
        where: { id: variant.id },
        data: { status: PostStatus.PUBLISHING, attempts: 0 },
      });
      await this.queueService.publishNow(variant.id, post.id, workspaceId);
    }

    return { ok: true, message: `Retrying ${failedVariants.length} variant(s).` };
  }

  /**
   * Bulk Actions: Reschedule, Delete, Change Status
   */
  async bulkAction(input: BulkPostActionInput) {
    const posts = await prisma.post.findMany({
      where: {
        id: { in: input.postIds },
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      include: { variants: true },
    });

    let affectedCount = 0;

    for (const post of posts) {
      if (input.action === 'delete') {
        for (const variant of post.variants) {
          await this.queueService.cancelVariantJob(variant.id);
        }
        await prisma.post.update({
          where: { id: post.id },
          data: { deletedAt: new Date(), status: PostStatus.CANCELLED },
        });
        affectedCount++;
      } else if (input.action === 'reschedule') {
        let nextDate: Date;
        if (input.newScheduledAt) {
          nextDate = new Date(input.newScheduledAt);
        } else if (input.rescheduleOffsetMinutes && post.scheduledAt) {
          nextDate = new Date(post.scheduledAt.getTime() + input.rescheduleOffsetMinutes * 60 * 1000);
        } else {
          continue;
        }

        await prisma.post.update({
          where: { id: post.id },
          data: { scheduledAt: nextDate, status: PostStatus.SCHEDULED },
        });

        for (const variant of post.variants) {
          await this.queueService.scheduleVariant(variant.id, post.id, post.workspaceId, nextDate);
        }
        affectedCount++;
      } else if (input.action === 'change_status' && input.newStatus) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: input.newStatus },
        });
        affectedCount++;
      }
    }

    return { ok: true, affectedCount };
  }

  /**
   * Validate CSV rows for Bulk Import
   */
  async validateCsv(workspaceId: string, rows: CsvRowInput[]) {
    const channels = await prisma.channel.findMany({
      where: { workspaceId, status: { not: 'DISABLED' } },
    });

    const report: Array<{
      rowNumber: number;
      valid: boolean;
      data: CsvRowInput;
      resolvedChannelIds: string[];
      errors: string[];
    }> = [];

    rows.forEach((row, idx) => {
      const errors: string[] = [];
      const resolvedChannelIds: string[] = [];

      // 1. Text check
      if (!row.text || row.text.trim().length === 0) {
        errors.push('Post text is missing');
      }

      // 2. Channel match
      const targetChannelNames = row.channels
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);

      for (const name of targetChannelNames) {
        const found = channels.find(
          (c) =>
            c.accountName.toLowerCase().includes(name) ||
            c.provider.toLowerCase() === name ||
            c.id === name,
        );
        if (found) {
          resolvedChannelIds.push(found.id);
        } else {
          errors.push(`Channel '${name}' not found or not connected in this workspace`);
        }
      }

      // 3. Date check
      const parsedDate = new Date(row.datetime);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Invalid datetime format '${row.datetime}'`);
      } else if (parsedDate.getTime() < Date.now()) {
        errors.push('Scheduled date cannot be in the past');
      }

      report.push({
        rowNumber: idx + 1,
        valid: errors.length === 0,
        data: row,
        resolvedChannelIds,
        errors,
      });
    });

    const validCount = report.filter((r) => r.valid).length;
    return {
      totalRows: rows.length,
      validCount,
      errorCount: rows.length - validCount,
      report,
    };
  }

  /**
   * Commit Valid CSV Rows into Scheduled Posts
   */
  async commitCsv(userId: string, workspaceId: string, validRows: CsvRowInput[]) {
    const validation = await this.validateCsv(workspaceId, validRows);
    const readyRows = validation.report.filter((r) => r.valid);

    const createdPosts = [];

    for (const item of readyRows) {
      const scheduledDate = new Date(item.data.datetime);
      const mediaUrls = item.data.mediaUrl
        ? item.data.mediaUrl.split(',').map((u) => u.trim()).filter(Boolean)
        : [];
      const tags = item.data.tags
        ? item.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const post = await this.createPost(userId, {
        workspaceId,
        timezone: 'UTC',
        scheduledAt: scheduledDate.toISOString(),
        tags,
        postNow: false,
        submitForApproval: false,
        variants: item.resolvedChannelIds.map((channelId) => ({
          channelId,
          content: item.data.text,
          mediaUrls,
          thread: [],
          settings: {},
        })),
      });

      createdPosts.push(post.id);
    }

    return {
      ok: true,
      importedCount: createdPosts.length,
      postIds: createdPosts,
    };
  }
}
