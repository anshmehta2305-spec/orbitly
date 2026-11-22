import { describe, it, expect } from 'vitest';
import {
  transitionApproval,
  canActorApprove,
  checkReApprovalOnEdit,
  detectPostChanges,
} from '../utils/approval-flow';
import { PostStatus, ApprovalStatus, MembershipRole } from '../types';

describe('Approval State Machine & Business Logic', () => {
  const baseCtx = {
    approvalRequired: true,
    autoPublishAfterApproval: true,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    actorRole: MembershipRole.ADMIN,
    isAuthor: false,
    allowSelfApproval: false,
  };

  it('allows Editor to submit a draft post for approval', () => {
    const res = transitionApproval(PostStatus.DRAFT, 'SUBMIT', {
      ...baseCtx,
      actorRole: MembershipRole.EDITOR,
      isAuthor: true,
    });
    expect(res.postStatus).toBe(PostStatus.PENDING_APPROVAL);
    expect(res.approvalStatus).toBe(ApprovalStatus.PENDING);
  });

  it('blocks submitting an already publishing or published post', () => {
    expect(() =>
      transitionApproval(PostStatus.PUBLISHED, 'SUBMIT', baseCtx),
    ).toThrow('Cannot submit an already publishing or published post');

    expect(() =>
      transitionApproval(PostStatus.PENDING_APPROVAL, 'SUBMIT', baseCtx),
    ).toThrow('Post is already pending approval');
  });

  it('allows Admin to approve a pending post and moves to SCHEDULED when scheduledAt is future', () => {
    const res = transitionApproval(PostStatus.PENDING_APPROVAL, 'APPROVE', baseCtx);
    expect(res.postStatus).toBe(PostStatus.SCHEDULED);
    expect(res.approvalStatus).toBe(ApprovalStatus.APPROVED);
  });

  it('leaves post in DRAFT when approved after its scheduledAt has passed (Missed schedule)', () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const res = transitionApproval(PostStatus.PENDING_APPROVAL, 'APPROVE', {
      ...baseCtx,
      scheduledAt: pastTime,
    });
    expect(res.postStatus).toBe(PostStatus.DRAFT);
    expect(res.approvalStatus).toBe(ApprovalStatus.APPROVED);
  });

  it('prevents a reviewer from approving their own post unless Owner', () => {
    const adminSelfApprove = canActorApprove(MembershipRole.ADMIN, true, false);
    expect(adminSelfApprove.allowed).toBe(false);
    expect(adminSelfApprove.reason).toContain('Reviewers cannot approve their own posts');

    const ownerSelfApprove = canActorApprove(MembershipRole.OWNER, true, false);
    expect(ownerSelfApprove.allowed).toBe(true);

    const viewerApprove = canActorApprove(MembershipRole.VIEWER, false, false);
    expect(viewerApprove.allowed).toBe(false);
  });

  it('allows Admin to request changes, returning status to DRAFT with reviewer note', () => {
    const res = transitionApproval(PostStatus.PENDING_APPROVAL, 'REQUEST_CHANGES', baseCtx, 'Please fix hashtags');
    expect(res.postStatus).toBe(PostStatus.DRAFT);
    expect(res.approvalStatus).toBe(ApprovalStatus.CHANGES_REQUESTED);
    expect(res.note).toBe('Please fix hashtags');
  });

  it('allows Admin to reject a post, setting status to CANCELLED', () => {
    const res = transitionApproval(PostStatus.PENDING_APPROVAL, 'REJECT', baseCtx, 'Violates policy');
    expect(res.postStatus).toBe(PostStatus.CANCELLED);
    expect(res.approvalStatus).toBe(ApprovalStatus.REJECTED);
  });

  it('resets approval and increments version when an approved post is edited', () => {
    const post = {
      status: PostStatus.APPROVED,
      approvalVersion: 1,
    };

    const editCheck = checkReApprovalOnEdit(post, true, true);
    expect(editCheck.needsReApproval).toBe(true);
    expect(editCheck.newStatus).toBe(PostStatus.DRAFT);
    expect(editCheck.newVersion).toBe(2);
  });

  it('does NOT reset approval if approvalRequired is false', () => {
    const post = {
      status: PostStatus.APPROVED,
      approvalVersion: 1,
    };

    const editCheck = checkReApprovalOnEdit(post, true, false);
    expect(editCheck.needsReApproval).toBe(false);
    expect(editCheck.newStatus).toBe(PostStatus.APPROVED);
    expect(editCheck.newVersion).toBe(1);
  });

  it('accurately detects content changes in posts and variants', () => {
    const original = {
      title: 'Original Title',
      content: 'Original body',
      tags: ['marketing'],
      variants: [{ channelId: 'c1', content: 'Text 1' }],
    };

    expect(detectPostChanges(original, { ...original })).toBe(false);
    expect(detectPostChanges(original, { ...original, content: 'Updated body' })).toBe(true);
    expect(detectPostChanges(original, { ...original, tags: ['marketing', 'brand'] })).toBe(true);
  });
});
