import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { prisma, PostStatus, ApprovalStatus, ShareScope } from '@orbitly/db';
import {
  VerifySharePasswordInput,
  RegisterShareReviewerInput,
  PublicShareCommentInput,
  PublicShareDecideInput,
  PublicSharePortalMetaDto,
  PublicSharePostDto,
  PublicShareVariantDto,
  PublicShareCommentDto,
  transitionApproval,
  MembershipRole,
} from '@orbitly/shared';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { EventsService } from '../../common/services/events.service';

interface FailedAttemptTracker {
  count: number;
  lockedUntil: number;
}

@Injectable()
export class PublicShareService {
  // In-memory brute force lockout store: tokenHash -> tracker
  private failedAttempts = new Map<string, FailedAttemptTracker>();

  constructor(private eventsService: EventsService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private checkBruteForceLockout(tokenHash: string) {
    const tracker = this.failedAttempts.get(tokenHash);
    if (tracker) {
      if (tracker.lockedUntil > Date.now()) {
        const remainingMinutes = Math.ceil((tracker.lockedUntil - Date.now()) / 60000);
        throw new HttpException(
          `Too many failed password attempts. Access temporarily locked for ${remainingMinutes} minute(s).`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else if (tracker.lockedUntil > 0) {
        // Lock has expired, reset tracker
        this.failedAttempts.delete(tokenHash);
      }
    }
  }

  private recordFailedAttempt(tokenHash: string) {
    const tracker = this.failedAttempts.get(tokenHash) || { count: 0, lockedUntil: 0 };
    tracker.count += 1;
    if (tracker.count >= 5) {
      tracker.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lockout
    }
    this.failedAttempts.set(tokenHash, tracker);
  }

  private resetFailedAttempts(tokenHash: string) {
    this.failedAttempts.delete(tokenHash);
  }

  private async resolveShareLink(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const link = await prisma.shareLink.findUnique({
      where: { tokenHash },
      include: {
        workspace: {
          include: {
            settings: true,
            subscription: true,
          },
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Share link not found or has expired');
    }

    if (link.revokedAt) {
      throw new ForbiddenException('This share link has been revoked');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new ForbiddenException('This share link has expired');
    }

    return link;
  }

  async getPortalMeta(rawToken: string): Promise<PublicSharePortalMetaDto> {
    const link = await this.resolveShareLink(rawToken);

    // Update view stats
    await prisma.shareLink.update({
      where: { id: link.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    const settings = link.workspace.settings;
    const isAgencyOrTeam =
      link.workspace.subscription?.planTier === 'AGENCY' ||
      link.workspace.subscription?.planTier === 'TEAM';

    return {
      name: link.name,
      scope: link.scope as any,
      requiresPassword: !!link.passwordHash,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      allowComments: link.allowComments,
      allowApprove: link.allowApprove,
      brand: {
        brandName: isAgencyOrTeam ? settings?.brandName || link.workspace.name : link.workspace.name,
        brandLogo: isAgencyOrTeam ? settings?.brandLogo : null,
        brandColor: isAgencyOrTeam ? settings?.brandColor : null,
      },
    };
  }

  async verifyPassword(rawToken: string, input: VerifySharePasswordInput): Promise<any> {
    const tokenHash = this.hashToken(rawToken);
    this.checkBruteForceLockout(tokenHash);

    const link = await this.resolveShareLink(rawToken);

    if (!link.passwordHash) {
      return { ok: true, accessGranted: true };
    }

    const isValid = await bcrypt.compare(input.password, link.passwordHash);
    if (!isValid) {
      this.recordFailedAttempt(tokenHash);
      throw new ForbiddenException('Invalid password for this review link');
    }

    this.resetFailedAttempts(tokenHash);
    return { ok: true, accessGranted: true };
  }

  async listScopedPosts(rawToken: string): Promise<PublicSharePostDto[]> {
    const link = await this.resolveShareLink(rawToken);

    const where: any = {
      workspaceId: link.workspaceId,
      deletedAt: null,
      status: {
        in: [
          PostStatus.DRAFT,
          PostStatus.PENDING_APPROVAL,
          PostStatus.APPROVED,
          PostStatus.SCHEDULED,
          PostStatus.PUBLISHED,
        ],
      },
    };

    if (link.channelIds && link.channelIds.length > 0) {
      where.variants = {
        some: { channelId: { in: link.channelIds } },
      };
    }

    if (link.dateFrom || link.dateTo) {
      where.scheduledAt = {};
      if (link.dateFrom) where.scheduledAt.gte = link.dateFrom;
      if (link.dateTo) where.scheduledAt.lte = link.dateTo;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        variants: {
          include: {
            channel: {
              select: {
                id: true,
                provider: true,
                accountName: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          where: { deletedAt: null, parentId: null },
          include: {
            author: { select: { name: true, email: true } },
            replies: {
              where: { deletedAt: null },
              include: { author: { select: { name: true, email: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });

    // STRICT DTO TRANSFORMATION: Whitelist safe fields ONLY.
    return posts.map((post) => {
      const variants: PublicShareVariantDto[] = post.variants.map((v) => ({
        id: v.id,
        channelId: v.channelId,
        provider: v.channel.provider as any,
        accountName: v.channel.accountName,
        avatar: v.channel.avatar,
        content: v.content,
        mediaUrls: v.mediaUrls || [],
        thread: v.thread || [],
        settings: v.settings,
      }));

      const comments: PublicShareCommentDto[] = post.comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        authorName: c.author?.name || c.sharedViewerName || 'Anonymous Reviewer',
        authorEmail: c.sharedViewerEmail || undefined,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        parentId: c.parentId,
        mediaUrls: c.mediaUrls || [],
        replies: c.replies.map((r) => ({
          id: r.id,
          postId: r.postId,
          authorName: r.author?.name || r.sharedViewerName || 'Anonymous Reviewer',
          authorEmail: r.sharedViewerEmail || undefined,
          content: r.content,
          createdAt: r.createdAt.toISOString(),
          parentId: r.parentId,
        })),
      }));

      return {
        id: post.id,
        title: post.title,
        status: post.status as any,
        scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        timezone: post.timezone,
        tags: post.tags,
        approvalVersion: post.approvalVersion,
        variants,
        comments,
      };
    });
  }

  async registerReviewer(rawToken: string, input: RegisterShareReviewerInput): Promise<any> {
    const link = await this.resolveShareLink(rawToken);

    const reviewer = await prisma.shareReviewer.upsert({
      where: {
        shareLinkId_email: {
          shareLinkId: link.id,
          email: input.email.toLowerCase(),
        },
      },
      update: {
        name: input.name,
        verifiedAt: new Date(),
      },
      create: {
        shareLinkId: link.id,
        name: input.name,
        email: input.email.toLowerCase(),
        verifiedAt: new Date(),
      },
    });

    return { success: true, reviewerId: reviewer.id, name: reviewer.name, email: reviewer.email };
  }

  async createClientComment(
    rawToken: string,
    postId: string,
    input: PublicShareCommentInput,
  ): Promise<any> {
    const link = await this.resolveShareLink(rawToken);

    if (!link.allowComments) {
      throw new ForbiddenException('Comments are disabled on this review link');
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post || post.workspaceId !== link.workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    // Upsert reviewer record
    await prisma.shareReviewer.upsert({
      where: {
        shareLinkId_email: {
          shareLinkId: link.id,
          email: input.reviewerEmail.toLowerCase(),
        },
      },
      update: { name: input.reviewerName },
      create: {
        shareLinkId: link.id,
        name: input.reviewerName,
        email: input.reviewerEmail.toLowerCase(),
      },
    });

    const comment = await prisma.comment.create({
      data: {
        postId,
        sharedViewerName: input.reviewerName,
        sharedViewerEmail: input.reviewerEmail.toLowerCase(),
        content: input.content,
        parentId: input.parentId,
        mediaUrls: input.mediaUrls || [],
      },
    });

    // Notify post author and workspace admins
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        workspaceId: link.workspaceId,
        title: 'Client Commented on Post',
        message: `${input.reviewerName} (${input.reviewerEmail}) commented via client portal: "${input.content.slice(0, 80)}"`,
        type: 'INFO',
        actionUrl: `/calendar?postId=${postId}`,
      },
    });

    this.eventsService.broadcastToWorkspace(link.workspaceId, {
      type: 'post.comment_created',
      data: { postId, comment },
    });

    return {
      id: comment.id,
      postId: comment.postId,
      authorName: input.reviewerName,
      authorEmail: input.reviewerEmail,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
    };
  }

  async clientDecide(
    rawToken: string,
    postId: string,
    input: PublicShareDecideInput,
  ): Promise<any> {
    const link = await this.resolveShareLink(rawToken);

    if (!link.allowApprove) {
      throw new ForbiddenException('Approvals are disabled on this review link');
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { variants: true },
    });

    if (!post || post.workspaceId !== link.workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    if (post.status === PostStatus.PUBLISHED) {
      throw new BadRequestException('Cannot change approval status on an already published post');
    }

    const newApprovalStatus =
      input.decision === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.CHANGES_REQUESTED;
    const newPostStatus =
      input.decision === 'APPROVE'
        ? post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now()
          ? PostStatus.SCHEDULED
          : PostStatus.APPROVED
        : PostStatus.DRAFT;

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: newPostStatus,
      },
    });

    // Record approval
    const approval = await prisma.approval.create({
      data: {
        postId,
        reviewerName: input.reviewerName,
        reviewerEmail: input.reviewerEmail.toLowerCase(),
        status: newApprovalStatus,
        note: input.note,
        version: post.approvalVersion,
        decidedAt: new Date(),
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        workspaceId: link.workspaceId,
        title: input.decision === 'APPROVE' ? 'Client Approved Post' : 'Client Requested Changes',
        message: `${input.reviewerName} decided: ${input.decision}. Note: ${input.note || 'None'}`,
        type: input.decision === 'APPROVE' ? 'SUCCESS' : 'WARNING',
        actionUrl: `/calendar?postId=${postId}`,
      },
    });

    this.eventsService.broadcastToWorkspace(link.workspaceId, {
      type: input.decision === 'APPROVE' ? 'post.approved' : 'post.changes_requested',
      data: { postId, status: newPostStatus, clientReviewer: input.reviewerName },
    });

    return {
      success: true,
      decision: input.decision,
      postStatus: newPostStatus,
      approvalId: approval.id,
    };
  }
}
