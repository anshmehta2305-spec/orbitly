import { describe, it, expect } from 'vitest';
import { canPerformAction, PERMISSIONS, PermissionAction } from '../security/rbac';
import { MembershipRole } from '../types';

describe('Role-Based Access Control (RBAC) Permission Matrix', () => {
  const roles = [
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.EDITOR,
    MembershipRole.VIEWER,
  ];

  it('Owner has permission for ALL defined actions', () => {
    const actions = Object.keys(PERMISSIONS) as PermissionAction[];
    for (const action of actions) {
      expect(canPerformAction(MembershipRole.OWNER, action)).toBe(true);
    }
  });

  it('Admin can do everything except Ownership Transfer and Workspace Deletion / Billing', () => {
    expect(canPerformAction(MembershipRole.ADMIN, 'OWNERSHIP_TRANSFER')).toBe(false);
    expect(canPerformAction(MembershipRole.ADMIN, 'WORKSPACE_DELETE')).toBe(false);
    expect(canPerformAction(MembershipRole.ADMIN, 'WORKSPACE_BILLING')).toBe(false);

    // Can manage team & approve posts
    expect(canPerformAction(MembershipRole.ADMIN, 'TEAM_INVITE')).toBe(true);
    expect(canPerformAction(MembershipRole.ADMIN, 'TEAM_REMOVE')).toBe(true);
    expect(canPerformAction(MembershipRole.ADMIN, 'POST_APPROVE')).toBe(true);
    expect(canPerformAction(MembershipRole.ADMIN, 'POST_CREATE')).toBe(true);
    expect(canPerformAction(MembershipRole.ADMIN, 'SHARE_LINK_CREATE')).toBe(true);
  });

  it('Editor can create, edit, submit posts and comment, but cannot manage team or approve', () => {
    // Allowed
    expect(canPerformAction(MembershipRole.EDITOR, 'POST_CREATE')).toBe(true);
    expect(canPerformAction(MembershipRole.EDITOR, 'POST_EDIT')).toBe(true);
    expect(canPerformAction(MembershipRole.EDITOR, 'POST_SUBMIT')).toBe(true);
    expect(canPerformAction(MembershipRole.EDITOR, 'COMMENT_CREATE')).toBe(true);
    expect(canPerformAction(MembershipRole.EDITOR, 'CALENDAR_VIEW')).toBe(true);

    // Denied
    expect(canPerformAction(MembershipRole.EDITOR, 'POST_APPROVE')).toBe(false);
    expect(canPerformAction(MembershipRole.EDITOR, 'POST_REQUEST_CHANGES')).toBe(false);
    expect(canPerformAction(MembershipRole.EDITOR, 'POST_REJECT')).toBe(false);
    expect(canPerformAction(MembershipRole.EDITOR, 'TEAM_INVITE')).toBe(false);
    expect(canPerformAction(MembershipRole.EDITOR, 'TEAM_REMOVE')).toBe(false);
    expect(canPerformAction(MembershipRole.EDITOR, 'SHARE_LINK_CREATE')).toBe(false);
  });

  it('Viewer can only view calendar and comment, cannot create posts or manage workspace', () => {
    // Allowed
    expect(canPerformAction(MembershipRole.VIEWER, 'CALENDAR_VIEW')).toBe(true);
    expect(canPerformAction(MembershipRole.VIEWER, 'CONTENT_VIEW')).toBe(true);
    expect(canPerformAction(MembershipRole.VIEWER, 'COMMENT_VIEW')).toBe(true);
    expect(canPerformAction(MembershipRole.VIEWER, 'COMMENT_CREATE')).toBe(true);

    // Denied
    expect(canPerformAction(MembershipRole.VIEWER, 'POST_CREATE')).toBe(false);
    expect(canPerformAction(MembershipRole.VIEWER, 'POST_EDIT')).toBe(false);
    expect(canPerformAction(MembershipRole.VIEWER, 'POST_SUBMIT')).toBe(false);
    expect(canPerformAction(MembershipRole.VIEWER, 'POST_APPROVE')).toBe(false);
    expect(canPerformAction(MembershipRole.VIEWER, 'TEAM_INVITE')).toBe(false);
  });
});
