import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, PostStatus, ApprovalStatus } from '@orbitly/db';
import {
  SubmitForApprovalInput,
  ApprovePostInput,
  RequestChangesInput,
  RejectPostInput,
  BulkApproveInput,
  MembershipRole,
  transitionApproval,
  canActorApprove,
} from '@orbitly/shared';
import { QueueService } from '../../common/services/queue.service';
import { EventsService } from '../../common/services/events.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private queueService: QueueService,
    private eventsService: EventsService,
    private auditService: AuditService,
  ) {}

  async submitForApproval(
    workspaceId: string,
    postId: string,
    userId: string,
    input: SubmitForApprovalInput,
  ): Promise<any> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { variants: true },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    if (post.status === PostStatus.PUBLISHED || post.status === PostStatus.PUBLISHING) {
      throw new BadRequestException('Cannot submit an already publishing or published post');
    }

    if (post.status === PostStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Post is already pending approval');
    }

    // Get workspace settings
    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    const approvalRequired = settings?.approvalRequired ?? false;
    if (!approvalRequired) {
      // If approval is not required, scheduling proceeds directly
      return { success: true, message: 'Workspace does not require approval' };
    }

    // Transition post status
    const transition = transitionApproval(post.status as any, 'SUBMIT', {
      approvalRequired: true,
      autoPublishAfterApproval: settings?.autoPublishAfterApproval ?? true,
      scheduledAt: post.scheduledAt,
      actorRole: MembershipRole.EDITOR,
      isAuthor: post.authorId === userId,
    }, input.note);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        status: transition.postStatus as any,
      },
    });

    // Create approval record
    const approval = await prisma.approval.create({
      data: {
        postId,
        requestedById: userId,
        status: ApprovalStatus.PENDING,
        note: input.note,
        version: post.approvalVersion,
      },
    });

    // Notify admins / approvers
    const admins = await prisma.membership.findMany({
      where: {
        workspaceId,
        role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] },
        userId: { not: userId },
      },
      select: { userId: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          workspaceId,
          title: 'Post Submitted for Approval',
          message: `A post was submitted for approval (v${post.approvalVersion}).`,
          type: 'INFO',
          actionUrl: `/approvals?postId=${postId}`,
        },
      });
    }

    // Broadcast SSE
    this.eventsService.broadcastToWorkspace(workspaceId, {
      type: 'post.submitted_for_approval',
      data: { postId, version: post.approvalVersion, status: transition.postStatus },
    });

    await this.auditService.logActivity({
      workspaceId,
      postId,
      actorId: userId,
      action: 'POST_SUBMITTED',
      entity: 'POST',
      entityId: postId,
      afterJson: { status: transition.postStatus, note: input.note },
    });

    return {
      success: true,
      post: updated,
      approval,
    };
  }

  async approvePost(
    workspaceId: string,
    postId: string,
    reviewerId: string,
    reviewerRole: MembershipRole,
    input: ApprovePostInput,
  ): Promise<any> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        variants: {
          include: { channel: true },
        },
      },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const isAuthor = post.authorId === reviewerId;
    const check = canActorApprove(reviewerRole, isAuthor, false);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    if (post.status !== PostStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve post in status ${post.status}. Post must be PENDING_APPROVAL.`);
    }

    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    const autoPublish = settings?.autoPublishAfterApproval ?? true;

    const transition = transitionApproval(post.status as any, 'APPROVE', {
      approvalRequired: true,
      autoPublishAfterApproval: autoPublish,
      scheduledAt: post.scheduledAt,
      actorRole: reviewerRole,
      isAuthor,
    }, input.note);

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: transition.postStatus as any,
      },
    });

    // Update approval record
    await prisma.approval.updateMany({
      where: { postId, version: post.approvalVersion },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewerId,
        decidedAt: new Date(),
        note: input.note,
      },
    });

    // If autoPublish and scheduledAt is future, schedule BullMQ jobs for all variants
    if (transition.postStatus === PostStatus.SCHEDULED && post.scheduledAt) {
      for (const variant of post.variants) {
        await prisma.postVariant.update({
          where: { id: variant.id },
          data: { status: PostStatus.SCHEDULED },
        });

        await this.queueService.scheduleVariant(
          variant.id,
          post.id,
          workspaceId,
          new Date(post.scheduledAt),
        );
      }
    } else if (post.scheduledAt && new Date(post.scheduledAt).getTime() <= Date.now()) {
      // Missed schedule alert
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          workspaceId,
          title: 'Post Approved - Missed Schedule',
          message: 'Your post was approved, but its scheduled time has passed. Please reschedule it from Calendar.',
          type: 'WARNING',
          actionUrl: `/calendar?postId=${postId}`,
        },
      });
    }

    // Notify author
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        workspaceId,
        title: 'Post Approved',
        message: `Your post was approved by ${reviewerRole.toLowerCase()}. Note: ${input.note || 'No notes'}`,
        type: 'SUCCESS',
        actionUrl: `/calendar?postId=${postId}`,
      },
    });

    // Broadcast SSE
    this.eventsService.broadcastToWorkspace(workspaceId, {
      type: 'post.approved',
      data: { postId, status: transition.postStatus },
    });

    await this.auditService.logActivity({
      workspaceId,
      postId,
      actorId: reviewerId,
      action: 'POST_APPROVED',
      entity: 'POST',
      entityId: postId,
      afterJson: { status: transition.postStatus, note: input.note },
    });

    return {
      success: true,
      post: updatedPost,
    };
  }

  async requestChanges(
    workspaceId: string,
    postId: string,
    reviewerId: string,
    reviewerRole: MembershipRole,
    input: RequestChangesInput,
  ): Promise<any> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const isAuthor = post.authorId === reviewerId;
    const check = canActorApprove(reviewerRole, isAuthor, false);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    if (post.status === PostStatus.PUBLISHED || post.status === PostStatus.PUBLISHING) {
      throw new BadRequestException('Cannot request changes on a published post');
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
      },
    });

    await prisma.approval.updateMany({
      where: { postId, version: post.approvalVersion },
      data: {
        status: ApprovalStatus.CHANGES_REQUESTED,
        reviewerId,
        decidedAt: new Date(),
        note: input.note,
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        workspaceId,
        title: 'Changes Requested on Post',
        message: `Reviewer requested changes: "${input.note}"`,
        type: 'WARNING',
        actionUrl: `/calendar?postId=${postId}`,
      },
    });

    this.eventsService.broadcastToWorkspace(workspaceId, {
      type: 'post.changes_requested',
      data: { postId, status: PostStatus.DRAFT, note: input.note },
    });

    await this.auditService.logActivity({
      workspaceId,
      postId,
      actorId: reviewerId,
      action: 'POST_CHANGES_REQUESTED',
      entity: 'POST',
      entityId: postId,
      afterJson: { status: PostStatus.DRAFT, note: input.note },
    });

    return {
      success: true,
      post: updatedPost,
      note: input.note,
    };
  }

  async rejectPost(
    workspaceId: string,
    postId: string,
    reviewerId: string,
    reviewerRole: MembershipRole,
    input: RejectPostInput,
  ): Promise<any> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const isAuthor = post.authorId === reviewerId;
    const check = canActorApprove(reviewerRole, isAuthor, false);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    if (post.status === PostStatus.PUBLISHED || post.status === PostStatus.PUBLISHING) {
      throw new BadRequestException('Cannot reject a published post');
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.CANCELLED,
      },
    });

    await prisma.approval.updateMany({
      where: { postId, version: post.approvalVersion },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewerId,
        decidedAt: new Date(),
        note: input.reason,
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        workspaceId,
        title: 'Post Rejected',
        message: `Your post was rejected. Reason: ${input.reason}`,
        type: 'ERROR',
        actionUrl: `/calendar?postId=${postId}`,
      },
    });

    this.eventsService.broadcastToWorkspace(workspaceId, {
      type: 'post.rejected',
      data: { postId, status: PostStatus.CANCELLED, reason: input.reason },
    });

    await this.auditService.logActivity({
      workspaceId,
      postId,
      actorId: reviewerId,
      action: 'POST_REJECTED',
      entity: 'POST',
      entityId: postId,
      afterJson: { status: PostStatus.CANCELLED, reason: input.reason },
    });

    return {
      success: true,
      post: updatedPost,
    };
  }

  async getApprovalsInbox(workspaceId: string, query?: { channelId?: string; authorId?: string }): Promise<any> {
    const where: any = {
      workspaceId,
      status: PostStatus.PENDING_APPROVAL,
    };

    if (query?.authorId) {
      where.authorId = query.authorId;
    }

    if (query?.channelId) {
      where.variants = {
        some: { channelId: query.channelId },
      };
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
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
        approvals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      total: posts.length,
      items: posts,
    };
  }

  async bulkApprove(
    workspaceId: string,
    reviewerId: string,
    reviewerRole: MembershipRole,
    input: BulkApproveInput,
  ): Promise<any> {
    const results: any[] = [];
    const errors: any[] = [];

    for (const postId of input.postIds) {
      try {
        const res = await this.approvePost(workspaceId, postId, reviewerId, reviewerRole, {
          note: input.note,
        });
        results.push({ postId, status: 'APPROVED' });
      } catch (err: any) {
        errors.push({ postId, error: err.message });
      }
    }

    return {
      approvedCount: results.length,
      failedCount: errors.length,
      results,
      errors,
    };
  }
}
