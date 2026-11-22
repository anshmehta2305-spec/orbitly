import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MembersService } from '../modules/members/members.service';
import { InvitationsService } from '../modules/invitations/invitations.service';
import { PublicShareService } from '../modules/public-share/public-share.service';
import { prisma, MembershipRole, InvitationStatus, PostStatus } from '@orbitly/db';

vi.mock('@orbitly/db', () => {
  const mockPrisma = {
    workspace: {
      findUnique: vi.fn(),
    },
    membership: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    shareLink: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    approval: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    membershipChannel: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb))),
  };

  return {
    prisma: mockPrisma,
    MembershipRole: {
      OWNER: 'OWNER',
      ADMIN: 'ADMIN',
      EDITOR: 'EDITOR',
      VIEWER: 'VIEWER',
    },
    InvitationStatus: {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      REVOKED: 'REVOKED',
      EXPIRED: 'EXPIRED',
    },
    PostStatus: {
      DRAFT: 'DRAFT',
      PENDING_APPROVAL: 'PENDING_APPROVAL',
      APPROVED: 'APPROVED',
      SCHEDULED: 'SCHEDULED',
      PUBLISHED: 'PUBLISHED',
      CANCELLED: 'CANCELLED',
    },
    ApprovalStatus: {
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      CHANGES_REQUESTED: 'CHANGES_REQUESTED',
    },
    ShareScope: {
      CALENDAR: 'CALENDAR',
      SELECTED_POSTS: 'SELECTED_POSTS',
    },
  };
});

describe('Teams, Approvals & Client Share API Quality Gates', () => {
  const auditServiceMock = {
    log: vi.fn().mockResolvedValue(true),
    logActivity: vi.fn().mockResolvedValue(true),
  } as any;

  const eventsServiceMock = {
    broadcastToWorkspace: vi.fn(),
    emit: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MembersService - Last Owner Protection', () => {
    const membersService = new MembersService(auditServiceMock);

    it('rejects demoting the only Owner of the workspace', async () => {
      (prisma.membership.findUnique as any).mockResolvedValue({
        id: 'mem_owner_1',
        workspaceId: 'ws_1',
        role: MembershipRole.OWNER,
      });

      (prisma.membership.count as any).mockResolvedValue(1); // Only 1 owner

      await expect(
        membersService.updateMemberRole('ws_1', 'mem_owner_1', 'user_1', {
          role: MembershipRole.ADMIN,
        }),
      ).rejects.toThrow('Cannot demote the last Owner of the workspace');
    });

    it('rejects removing the only Owner of the workspace', async () => {
      (prisma.membership.findUnique as any).mockResolvedValue({
        id: 'mem_owner_1',
        workspaceId: 'ws_1',
        role: MembershipRole.OWNER,
      });

      (prisma.membership.count as any).mockResolvedValue(1);

      await expect(
        membersService.removeMember('ws_1', 'mem_owner_1', 'user_1'),
      ).rejects.toThrow('Cannot remove the last Owner of the workspace');
    });

    it('allows demoting an Owner if another Owner exists', async () => {
      (prisma.membership.findUnique as any).mockResolvedValue({
        id: 'mem_owner_1',
        workspaceId: 'ws_1',
        role: MembershipRole.OWNER,
      });

      (prisma.membership.count as any).mockResolvedValue(2); // 2 owners

      (prisma.membership.update as any).mockResolvedValue({
        id: 'mem_owner_1',
        role: MembershipRole.ADMIN,
      });

      const res = await membersService.updateMemberRole('ws_1', 'mem_owner_1', 'user_1', {
        role: MembershipRole.ADMIN,
      });
      expect(res.role).toBe(MembershipRole.ADMIN);
    });
  });

  describe('InvitationsService - Seat Limits & Expiry', () => {
    const invitationsService = new InvitationsService(auditServiceMock);

    it('enforces plan seat limits when inviting new members', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws_1',
        subscription: { planTier: 'FREE' }, // Max 1 member
        _count: { memberships: 1 },
      });

      (prisma.membership.findFirst as any).mockResolvedValue(null);
      (prisma.invitation.count as any).mockResolvedValue(0);

      await expect(
        invitationsService.createInvitation('ws_1', 'user_1', {
          email: 'newbie@example.com',
          role: MembershipRole.EDITOR,
        }),
      ).rejects.toThrow(/Workspace member seat limit reached/);
    });

    it('rejects accepting an expired invitation (older than 7 days)', async () => {
      const pastDate = new Date(Date.now() - 10000);
      (prisma.invitation.findFirst as any).mockResolvedValue({
        id: 'inv_1',
        workspaceId: 'ws_1',
        email: 'invited@example.com',
        role: MembershipRole.EDITOR,
        expires: pastDate,
        status: InvitationStatus.PENDING,
      });

      await expect(
        invitationsService.acceptInvitation({ token: 'mock_token' }, 'user_2'),
      ).rejects.toThrow('This invitation has expired (valid for 7 days)');
    });

    it('rejects inviting an email that is already a workspace member', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue({
        id: 'existing_mem',
      });

      await expect(
        invitationsService.createInvitation('ws_1', 'user_1', {
          email: 'existing@example.com',
          role: MembershipRole.EDITOR,
        }),
      ).rejects.toThrow('This user is already a member of this workspace');
    });
  });

  describe('PublicShareService - Security & DTO Guarantees', () => {
    const publicShareService = new PublicShareService(eventsServiceMock);

    it('rejects revoked share links', async () => {
      (prisma.shareLink.findUnique as any).mockResolvedValue({
        id: 'link_1',
        revokedAt: new Date(),
      });

      await expect(
        publicShareService.getPortalMeta('revoked_raw_token'),
      ).rejects.toThrow('This share link has been revoked');
    });

    it('rejects expired share links', async () => {
      (prisma.shareLink.findUnique as any).mockResolvedValue({
        id: 'link_1',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        revokedAt: null,
      });

      await expect(
        publicShareService.getPortalMeta('expired_raw_token'),
      ).rejects.toThrow('This share link has expired');
    });

    it('enforces brute-force lockout after 5 consecutive failed password attempts', async () => {
      (prisma.shareLink.findUnique as any).mockResolvedValue({
        id: 'link_pw',
        passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        expiresAt: null,
        revokedAt: null,
      });

      const token = 'brute_force_test_token';

      // 5 failed password attempts
      for (let i = 0; i < 4; i++) {
        await expect(
          publicShareService.verifyPassword(token, { password: 'wrong_password' }),
        ).rejects.toThrow('Invalid password for this review link');
      }

      // 5th attempt triggers lockout
      await expect(
        publicShareService.verifyPassword(token, { password: 'wrong_password' }),
      ).rejects.toThrow('Invalid password for this review link');

      // 6th attempt is blocked immediately with 429
      await expect(
        publicShareService.verifyPassword(token, { password: 'wrong_password' }),
      ).rejects.toThrow(/Too many failed password attempts/);
    });

    it('whitelists only safe public fields when listing scoped posts', async () => {
      (prisma.shareLink.findUnique as any).mockResolvedValue({
        id: 'link_1',
        workspaceId: 'ws_1',
        channelIds: [],
        dateFrom: null,
        dateTo: null,
        revokedAt: null,
        expiresAt: null,
      });

      (prisma.post.findMany as any).mockResolvedValue([
        {
          id: 'post_1',
          title: 'Public Preview Post',
          status: PostStatus.APPROVED,
          scheduledAt: new Date('2026-11-25T10:00:00Z'),
          publishedAt: null,
          timezone: 'UTC',
          tags: ['q4'],
          approvalVersion: 1,
          workspaceId: 'ws_1',
          // Internal fields that MUST NOT leak
          tokenHash: 'secret_token_hash',
          variants: [
            {
              id: 'var_1',
              channelId: 'ch_1',
              content: 'Public Content',
              mediaUrls: [],
              thread: [],
              settings: {},
              channel: {
                id: 'ch_1',
                provider: 'BLUESKY',
                accountName: '@orbitly.bsky.social',
                avatar: null,
                encryptedAccessToken: 'DO_NOT_LEAK',
                encryptedRefreshToken: 'DO_NOT_LEAK',
              },
            },
          ],
          comments: [],
        },
      ]);

      const scopedPosts = await publicShareService.listScopedPosts('valid_token');
      expect(scopedPosts.length).toBe(1);

      const serialized = JSON.stringify(scopedPosts[0]);
      expect(serialized).not.toContain('encryptedAccessToken');
      expect(serialized).not.toContain('encryptedRefreshToken');
      expect(serialized).not.toContain('secret_token_hash');
      expect(scopedPosts[0].variants[0].accountName).toBe('@orbitly.bsky.social');
    });
  });
});
