import { describe, it, expect } from 'vitest';
import { MembershipRole } from '../types';
import { hasPermission, ROLE_HIERARCHY } from '../security/rbac';

describe('RBAC Role Hierarchy & Permissions', () => {
  it('verifies OWNER has higher or equal permissions than everyone', () => {
    expect(hasPermission(MembershipRole.OWNER, MembershipRole.OWNER)).toBe(true);
    expect(hasPermission(MembershipRole.OWNER, MembershipRole.ADMIN)).toBe(true);
    expect(hasPermission(MembershipRole.OWNER, MembershipRole.EDITOR)).toBe(true);
    expect(hasPermission(MembershipRole.OWNER, MembershipRole.VIEWER)).toBe(true);
  });

  it('verifies ADMIN can do editor/viewer tasks but cannot do owner-only tasks', () => {
    expect(hasPermission(MembershipRole.ADMIN, MembershipRole.OWNER)).toBe(false);
    expect(hasPermission(MembershipRole.ADMIN, MembershipRole.ADMIN)).toBe(true);
    expect(hasPermission(MembershipRole.ADMIN, MembershipRole.EDITOR)).toBe(true);
    expect(hasPermission(MembershipRole.ADMIN, MembershipRole.VIEWER)).toBe(true);
  });

  it('verifies EDITOR cannot do admin actions', () => {
    expect(hasPermission(MembershipRole.EDITOR, MembershipRole.ADMIN)).toBe(false);
    expect(hasPermission(MembershipRole.EDITOR, MembershipRole.EDITOR)).toBe(true);
    expect(hasPermission(MembershipRole.EDITOR, MembershipRole.VIEWER)).toBe(true);
  });

  it('verifies VIEWER has only viewer access', () => {
    expect(hasPermission(MembershipRole.VIEWER, MembershipRole.EDITOR)).toBe(false);
    expect(hasPermission(MembershipRole.VIEWER, MembershipRole.VIEWER)).toBe(true);
  });
});
