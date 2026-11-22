import { PostStatus, ApprovalStatus, MembershipRole } from '../types';

export interface ApprovalTransitionContext {
  approvalRequired: boolean;
  autoPublishAfterApproval: boolean;
  scheduledAt?: Date | string | null;
  actorRole: MembershipRole;
  isAuthor: boolean;
  allowSelfApproval?: boolean;
}

export interface TransitionResult {
  postStatus: PostStatus;
  approvalStatus: ApprovalStatus;
  note?: string;
}

export function canActorApprove(
  actorRole: MembershipRole,
  isAuthor: boolean,
  allowSelfApproval: boolean = false,
): { allowed: boolean; reason?: string } {
  if (actorRole !== MembershipRole.ADMIN && actorRole !== MembershipRole.OWNER) {
    return { allowed: false, reason: 'Only Admins and Owners can approve or review posts' };
  }

  if (isAuthor && !allowSelfApproval && actorRole !== MembershipRole.OWNER) {
    return { allowed: false, reason: 'Reviewers cannot approve their own posts' };
  }

  return { allowed: true };
}

export function transitionApproval(
  currentPostStatus: PostStatus,
  action: 'SUBMIT' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT',
  ctx: ApprovalTransitionContext,
  note?: string,
): TransitionResult {
  switch (action) {
    case 'SUBMIT': {
      if (currentPostStatus === PostStatus.PUBLISHED || currentPostStatus === PostStatus.PUBLISHING) {
        throw new Error('Cannot submit an already publishing or published post');
      }
      if (currentPostStatus === PostStatus.PENDING_APPROVAL) {
        throw new Error('Post is already pending approval');
      }
      return {
        postStatus: PostStatus.PENDING_APPROVAL,
        approvalStatus: ApprovalStatus.PENDING,
        note,
      };
    }

    case 'APPROVE': {
      const check = canActorApprove(ctx.actorRole, ctx.isAuthor, ctx.allowSelfApproval);
      if (!check.allowed) {
        throw new Error(check.reason);
      }

      if (currentPostStatus !== PostStatus.PENDING_APPROVAL) {
        throw new Error(`Cannot approve post in status ${currentPostStatus}. Post must be PENDING_APPROVAL.`);
      }

      let nextPostStatus: PostStatus = PostStatus.APPROVED;
      if (ctx.autoPublishAfterApproval && ctx.scheduledAt) {
        const scheduledTime = new Date(ctx.scheduledAt).getTime();
        if (scheduledTime > Date.now()) {
          nextPostStatus = PostStatus.SCHEDULED;
        } else {
          // Scheduled time has already elapsed while waiting for approval
          nextPostStatus = PostStatus.DRAFT;
        }
      }

      return {
        postStatus: nextPostStatus,
        approvalStatus: ApprovalStatus.APPROVED,
        note,
      };
    }

    case 'REQUEST_CHANGES': {
      const check = canActorApprove(ctx.actorRole, ctx.isAuthor, ctx.allowSelfApproval);
      if (!check.allowed) {
        throw new Error(check.reason);
      }

      if (currentPostStatus === PostStatus.PUBLISHED || currentPostStatus === PostStatus.PUBLISHING) {
        throw new Error('Cannot request changes on a published post');
      }

      return {
        postStatus: PostStatus.DRAFT,
        approvalStatus: ApprovalStatus.CHANGES_REQUESTED,
        note,
      };
    }

    case 'REJECT': {
      const check = canActorApprove(ctx.actorRole, ctx.isAuthor, ctx.allowSelfApproval);
      if (!check.allowed) {
        throw new Error(check.reason);
      }

      if (currentPostStatus === PostStatus.PUBLISHED || currentPostStatus === PostStatus.PUBLISHING) {
        throw new Error('Cannot reject a published post');
      }

      return {
        postStatus: PostStatus.CANCELLED,
        approvalStatus: ApprovalStatus.REJECTED,
        note,
      };
    }

    default:
      throw new Error(`Unknown approval action: ${action}`);
  }
}

export function detectPostChanges(
  original: {
    title?: string | null;
    content?: string;
    scheduledAt?: Date | string | null;
    tags?: string[];
    variants?: Array<{ channelId: string; content: string }>;
  },
  updated: {
    title?: string | null;
    content?: string;
    scheduledAt?: Date | string | null;
    tags?: string[];
    variants?: Array<{ channelId: string; content: string }>;
  },
): boolean {
  if (original.title !== updated.title) return true;
  if (original.content !== updated.content) return true;
  if (String(original.scheduledAt) !== String(updated.scheduledAt)) return true;
  if (JSON.stringify(original.tags ?? []) !== JSON.stringify(updated.tags ?? [])) return true;

  if (updated.variants && original.variants) {
    if (original.variants.length !== updated.variants.length) return true;
    for (let i = 0; i < original.variants.length; i++) {
      if (original.variants[i].channelId !== updated.variants[i]?.channelId) return true;
      if (original.variants[i].content !== updated.variants[i]?.content) return true;
    }
  }

  return false;
}

export function checkReApprovalOnEdit(
  post: {
    status: PostStatus;
    approvalVersion: number;
  },
  hasContentChanged: boolean,
  approvalRequired: boolean,
): {
  needsReApproval: boolean;
  newStatus: PostStatus;
  newVersion: number;
} {
  if (!approvalRequired || !hasContentChanged) {
    return {
      needsReApproval: false,
      newStatus: post.status,
      newVersion: post.approvalVersion,
    };
  }

  // If the post was submitted, approved, or scheduled, an edit invalidates prior approval
  if (
    post.status === PostStatus.PENDING_APPROVAL ||
    post.status === PostStatus.APPROVED ||
    post.status === PostStatus.SCHEDULED
  ) {
    return {
      needsReApproval: true,
      newStatus: PostStatus.DRAFT,
      newVersion: post.approvalVersion + 1,
    };
  }

  return {
    needsReApproval: false,
    newStatus: post.status,
    newVersion: post.approvalVersion,
  };
}
