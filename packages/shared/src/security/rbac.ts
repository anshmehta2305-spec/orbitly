import { MembershipRole } from '../types';

export const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  [MembershipRole.OWNER]: 4,
  [MembershipRole.ADMIN]: 3,
  [MembershipRole.EDITOR]: 2,
  [MembershipRole.VIEWER]: 1,
};

export function hasPermission(userRole: MembershipRole, requiredRole: MembershipRole): boolean {
  const userRank = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredRank = ROLE_HIERARCHY[requiredRole] ?? 999;
  return userRank >= requiredRank;
}

export const PERMISSIONS = {
  // Workspace management
  WORKSPACE_UPDATE: MembershipRole.ADMIN,
  WORKSPACE_DELETE: MembershipRole.OWNER,
  WORKSPACE_BILLING: MembershipRole.OWNER,
  SETTINGS_VIEW: MembershipRole.VIEWER,
  SETTINGS_UPDATE: MembershipRole.ADMIN,

  // Team management
  TEAM_LIST: MembershipRole.VIEWER,
  TEAM_INVITE: MembershipRole.ADMIN,
  TEAM_REMOVE: MembershipRole.ADMIN,
  TEAM_ROLE_CHANGE: MembershipRole.OWNER,
  OWNERSHIP_TRANSFER: MembershipRole.OWNER,

  // Channels
  CHANNEL_CONNECT: MembershipRole.ADMIN,
  CHANNEL_DISCONNECT: MembershipRole.ADMIN,

  // Posts & Calendar
  CALENDAR_VIEW: MembershipRole.VIEWER,
  POST_CREATE: MembershipRole.EDITOR,
  POST_EDIT: MembershipRole.EDITOR,
  POST_DELETE: MembershipRole.EDITOR,
  POST_SUBMIT: MembershipRole.EDITOR,
  POST_APPROVE: MembershipRole.ADMIN,
  POST_REQUEST_CHANGES: MembershipRole.ADMIN,
  POST_REJECT: MembershipRole.ADMIN,
  POST_SCHEDULE: MembershipRole.EDITOR,

  // Comments
  COMMENT_VIEW: MembershipRole.VIEWER,
  COMMENT_CREATE: MembershipRole.VIEWER,
  COMMENT_RESOLVE: MembershipRole.EDITOR,
  COMMENT_DELETE_ANY: MembershipRole.ADMIN,

  // Share links
  SHARE_LINK_CREATE: MembershipRole.ADMIN,
  SHARE_LINK_MANAGE: MembershipRole.ADMIN,
  SHARE_LINK_VIEW: MembershipRole.VIEWER,

  // View only
  CONTENT_VIEW: MembershipRole.VIEWER,
  ANALYTICS_VIEW: MembershipRole.VIEWER,
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

export function canPerformAction(userRole: MembershipRole, action: PermissionAction): boolean {
  const requiredRole = PERMISSIONS[action];
  return hasPermission(userRole, requiredRole);
}
