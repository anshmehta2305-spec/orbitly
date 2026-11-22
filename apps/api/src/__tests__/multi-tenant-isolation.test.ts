import { describe, it, expect } from 'vitest';
import { assertWorkspaceScope, TenantIsolationViolationError } from '@orbitly/db';

describe('Multi-Tenant Isolation & Security Hardening Tests', () => {
  describe('Prisma Query Isolation Guard', () => {
    it('throws TenantIsolationViolationError if query on Post model omits workspaceId', () => {
      expect(() => {
        assertWorkspaceScope('Post', 'findMany', { where: { status: 'SCHEDULED' } });
      }).toThrow(TenantIsolationViolationError);
    });

    it('throws TenantIsolationViolationError if query on Channel model omits workspaceId', () => {
      expect(() => {
        assertWorkspaceScope('Channel', 'findFirst', { where: { id: 'chan_123' } });
      }).toThrow(TenantIsolationViolationError);
    });

    it('throws TenantIsolationViolationError if query on ApiKey model omits workspaceId', () => {
      expect(() => {
        assertWorkspaceScope('ApiKey', 'update', { where: { id: 'key_123' } });
      }).toThrow(TenantIsolationViolationError);
    });

    it('passes assertion when where clause explicitly contains workspaceId', () => {
      expect(() => {
        assertWorkspaceScope('Post', 'findMany', {
          where: { workspaceId: 'ws_alpha', status: 'SCHEDULED' },
        });
      }).not.toThrow();
    });

    it('ignores non-tenant models like User and Plan', () => {
      expect(() => {
        assertWorkspaceScope('User', 'findFirst', { where: { email: 'user@example.com' } });
      }).not.toThrow();

      expect(() => {
        assertWorkspaceScope('Plan', 'findMany', {});
      }).not.toThrow();
    });
  });

  describe('Cross-Workspace Data Access Denials (IDOR Protection)', () => {
    const mockDb = {
      posts: [
        { id: 'post_ws1_101', workspaceId: 'ws_alpha', content: 'Secret Alpha Strategy' },
        { id: 'post_ws2_202', workspaceId: 'ws_beta', content: 'Secret Beta Strategy' },
      ],
      channels: [
        { id: 'chan_ws1_1', workspaceId: 'ws_alpha', platform: 'LINKEDIN' },
        { id: 'chan_ws2_2', workspaceId: 'ws_beta', platform: 'X' },
      ],
      automations: [
        { id: 'auto_ws1_1', workspaceId: 'ws_alpha', name: 'Alpha Evergreen' },
        { id: 'auto_ws2_2', workspaceId: 'ws_beta', name: 'Beta RSS' },
      ],
    };

    function getPostForWorkspace(postId: string, requestingWorkspaceId: string) {
      assertWorkspaceScope('Post', 'findFirst', {
        where: { id: postId, workspaceId: requestingWorkspaceId },
      });
      const post = mockDb.posts.find(
        (p) => p.id === postId && p.workspaceId === requestingWorkspaceId,
      );
      if (!post) {
        throw new Error('ResourceNotFoundOrAccessDenied');
      }
      return post;
    }

    function disconnectChannel(channelId: string, requestingWorkspaceId: string) {
      assertWorkspaceScope('Channel', 'delete', {
        where: { id: channelId, workspaceId: requestingWorkspaceId },
      });
      const channel = mockDb.channels.find(
        (c) => c.id === channelId && c.workspaceId === requestingWorkspaceId,
      );
      if (!channel) {
        throw new Error('ChannelNotFoundOrAccessDenied');
      }
      return { success: true };
    }

    it('permits access when requesting workspace matches post workspace', () => {
      const post = getPostForWorkspace('post_ws1_101', 'ws_alpha');
      expect(post.content).toBe('Secret Alpha Strategy');
    });

    it('strictly denies cross-workspace read access to another tenant post', () => {
      expect(() => {
        getPostForWorkspace('post_ws2_202', 'ws_alpha');
      }).toThrow('ResourceNotFoundOrAccessDenied');
    });

    it('strictly denies cross-workspace channel disconnect mutation', () => {
      expect(() => {
        disconnectChannel('chan_ws2_2', 'ws_alpha');
      }).toThrow('ChannelNotFoundOrAccessDenied');
    });

    it('allows channel disconnect when workspace ownership matches', () => {
      const res = disconnectChannel('chan_ws1_1', 'ws_alpha');
      expect(res.success).toBe(true);
    });
  });

  describe('File Upload MIME Magic Bytes & Payload Verification', () => {
    function verifyMagicBytes(buffer: Buffer): { mime: string; allowed: boolean } {
      // PNG magic bytes: 89 50 4E 47
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        return { mime: 'image/png', allowed: true };
      }
      // JPEG magic bytes: FF D8 FF
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mime: 'image/jpeg', allowed: true };
      }
      // Disallowed executable (MZ header for PE/exe): 4D 5A
      if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
        return { mime: 'application/x-dosexec', allowed: false };
      }
      return { mime: 'application/octet-stream', allowed: false };
    }

    it('approves genuine PNG image based on magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const res = verifyMagicBytes(pngBuffer);
      expect(res.allowed).toBe(true);
      expect(res.mime).toBe('image/png');
    });

    it('approves genuine JPEG image based on magic bytes', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = verifyMagicBytes(jpegBuffer);
      expect(res.allowed).toBe(true);
      expect(res.mime).toBe('image/jpeg');
    });

    it('rejects disguised executable spoofed as an image', () => {
      // MZ header disguised with .png filename
      const exeDisguised = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      const res = verifyMagicBytes(exeDisguised);
      expect(res.allowed).toBe(false);
      expect(res.mime).toBe('application/x-dosexec');
    });
  });
});
