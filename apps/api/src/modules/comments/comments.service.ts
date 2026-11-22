import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, MembershipRole } from '@orbitly/db';
import {
  CreateCommentInput,
  UpdateCommentInput,
} from '@orbitly/shared';
import { EventsService } from '../../common/services/events.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class CommentsService {
  constructor(
    private eventsService: EventsService,
    private auditService: AuditService,
  ) {}

  async listComments(postId: string): Promise<any> {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, deletedAt: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  async createComment(
    workspaceId: string,
    postId: string,
    userId: string,
    input: CreateCommentInput,
  ): Promise<any> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: input.content,
        parentId: input.parentId,
        mentions: input.mentions || [],
        mediaUrls: input.mediaUrls || [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Notify author if someone else commented
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          workspaceId,
          title: 'New Comment on Post',
          message: `${user?.name || user?.email || 'A team member'} commented: "${input.content.slice(0, 80)}"`,
          type: 'INFO',
          actionUrl: `/calendar?postId=${postId}`,
        },
      });
    }

    // Handle @mentions: notify mentioned team members
    if (input.mentions && input.mentions.length > 0) {
      for (const mentionedUserId of input.mentions) {
        if (mentionedUserId !== userId && mentionedUserId !== post.authorId) {
          await prisma.notification.create({
            data: {
              userId: mentionedUserId,
              workspaceId,
              title: 'You were mentioned in a post comment',
              message: `${user?.name || 'A team member'} mentioned you: "${input.content.slice(0, 80)}"`,
              type: 'INFO',
              actionUrl: `/calendar?postId=${postId}`,
            },
          });
        }
      }
    }

    // Broadcast SSE
    this.eventsService.broadcastToWorkspace(workspaceId, {
      type: 'post.comment_created',
      data: { postId, comment },
    });

    await this.auditService.logActivity({
      workspaceId,
      postId,
      actorId: userId,
      actorName: user?.name || undefined,
      actorEmail: user?.email || undefined,
      action: 'COMMENT_ADDED',
      entity: 'COMMENT',
      entityId: comment.id,
      afterJson: { content: input.content, parentId: input.parentId },
    });

    return comment;
  }

  async updateComment(
    commentId: string,
    userId: string,
    input: UpdateCommentInput,
  ): Promise<any> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: input.content },
    });

    return updated;
  }

  async deleteComment(
    commentId: string,
    userId: string,
    userRole: MembershipRole,
  ): Promise<any> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.authorId === userId;
    const isAdmin = userRole === MembershipRole.ADMIN || userRole === MembershipRole.OWNER;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Comment deleted successfully' };
  }

  async resolveComment(commentId: string): Promise<any> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        resolvedAt: comment.resolvedAt ? null : new Date(), // Toggle resolve/unresolve
      },
    });

    return updated;
  }

  async getPostActivity(postId: string): Promise<any> {
    const logs = await prisma.activityLog.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      take: 50,
    });

    return logs;
  }
}
