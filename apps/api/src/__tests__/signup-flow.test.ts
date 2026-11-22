import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../modules/auth/auth.service';
import { AuditService } from '../common/services/audit.service';
import { SignupSchema } from '@orbitly/shared';
import { prisma, MembershipRole } from '@orbitly/db';

vi.mock('@orbitly/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
  MembershipRole: {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER',
  },
}));

describe('Auth Signup Flow & Quality Gates', () => {
  let authService: AuthService;
  let mockAuditService: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditService = { log: vi.fn() } as unknown as AuditService;
    authService = new AuthService(mockAuditService);
  });

  it('rejects weak passwords and invalid email with field-level schema errors', () => {
    const invalidInputs = [
      { name: 'John Doe', email: 'not-an-email', password: '123' },
      { name: 'J', email: 'john@example.com', password: 'weak' },
      { name: 'Valid Name', email: 'valid@example.com', password: 'alllowercasenonumber' },
    ];

    for (const input of invalidInputs) {
      const result = SignupSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    }
  });

  it('successfully creates user, personal workspace, owner membership, and verification token', async () => {
    const signupData = {
      name: 'Sarah Connor',
      email: 'sarah@skynet.ai',
      password: 'StrongPassword2026!',
      workspaceName: 'Resistance Studio',
    };

    (prisma.user.findUnique as any).mockResolvedValue(null);

    const createdUser = {
      id: 'usr_sarah_1',
      name: signupData.name,
      email: signupData.email,
      locale: 'en',
      timezone: 'UTC',
      emailVerified: null,
      memberships: [
        {
          role: MembershipRole.OWNER,
          workspace: {
            id: 'ws_resistance_1',
            name: signupData.workspaceName,
            slug: 'resistance-studio-abc12',
          },
        },
      ],
    };

    (prisma.user.create as any).mockResolvedValue(createdUser);
    (prisma.verificationToken.create as any).mockResolvedValue({ id: 'vt_1' });
    (prisma.session.create as any).mockResolvedValue({ id: 'sess_1' });

    const result = await authService.signup(signupData, '127.0.0.1', 'Vitest/TestAgent');

    expect(result.user.id).toBe('usr_sarah_1');
    expect(result.workspace?.id).toBe('ws_resistance_1');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.verificationToken).toBeDefined();
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AUTH_SIGNUP',
        entityType: 'USER',
        entityId: 'usr_sarah_1',
      }),
    );
  });

  it('rejects duplicate email with 409 ConflictException', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_existing',
      email: 'duplicate@orbitly.app',
    });

    await expect(
      authService.signup({
        name: 'Duplicate User',
        email: 'duplicate@orbitly.app',
        password: 'Password123!',
      }),
    ).rejects.toThrow('An account with this email address already exists');
  });

  it('preserves signup success even if SMTP / Mailpit is down', async () => {
    const signupData = {
      name: 'Resilient User',
      email: 'resilient@orbitly.io',
      password: 'Password123!',
    };

    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'usr_resilient_1',
      name: signupData.name,
      email: signupData.email,
      locale: 'en',
      timezone: 'UTC',
      emailVerified: null,
      memberships: [{ role: MembershipRole.OWNER, workspace: { id: 'ws_res_1' } }],
    });
    (prisma.verificationToken.create as any).mockResolvedValue({ id: 'vt_res_1' });
    (prisma.session.create as any).mockResolvedValue({ id: 'sess_res_1' });

    // Mock sendVerificationEmail failure (e.g. SMTP ECONNREFUSED)
    vi.spyOn(authService, 'sendVerificationEmail').mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 127.0.0.1:1025'),
    );

    // Signup must NOT throw or crash with 500
    const result = await authService.signup(signupData);
    expect(result.user.id).toBe('usr_resilient_1');
    expect(result.tokens.accessToken).toBeDefined();
  });
});
