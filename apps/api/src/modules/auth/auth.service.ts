import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, User, GlobalRole, MembershipRole } from '@orbitly/db';
import {
  SignupInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  JwtTokenPair,
  hashToken,
} from '@orbitly/shared';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class AuthService {
  private readonly jwtSecret =
    process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-orbitly-1234567890';
  private readonly jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET || 'super-secret-jwt-refresh-key-replace-in-production-orbitly-0987654321';

  // In-memory brute force protection tracking (IP/Email -> attempts, lockedUntil)
  private loginAttempts: Map<string, { attempts: number; lockedUntil?: number }> = new Map();

  constructor(@Inject(AuditService) private auditService: AuditService) {}

  // ----------------------------------------------------
  // Rate Limiting & Brute Force Prevention
  // ----------------------------------------------------
  private checkRateLimit(key: string) {
    const record = this.loginAttempts.get(key);
    if (record) {
      if (record.lockedUntil && record.lockedUntil > Date.now()) {
        const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
        throw new BadRequestException(
          `Too many failed attempts. Account temporarily locked for ${remainingSeconds} seconds.`,
        );
      }
      if (record.lockedUntil && record.lockedUntil <= Date.now()) {
        this.loginAttempts.delete(key);
      }
    }
  }

  private recordFailedAttempt(key: string) {
    const record = this.loginAttempts.get(key) || { attempts: 0 };
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
    }
    this.loginAttempts.set(key, record);
  }

  private clearFailedAttempts(key: string) {
    this.loginAttempts.delete(key);
  }

  // ----------------------------------------------------
  // Password Hashing & Verification
  // ----------------------------------------------------
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Check if it's salt-based sha256 from seed or bcrypt
    if (hash.includes(':')) {
      const [expectedHash, salt] = hash.split(':');
      const testHash = crypto.createHash('sha256').update(`${password}:${salt}`).digest('hex');
      return testHash === expectedHash;
    }
    return bcrypt.compare(password, hash);
  }

  // ----------------------------------------------------
  // JWT Generation & Token Rotation
  // ----------------------------------------------------
  generateTokenPair(user: User, currentWorkspaceId?: string): JwtTokenPair {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      currentWorkspaceId,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, this.jwtRefreshSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 mins in seconds
    };
  }

  // ----------------------------------------------------
  // Signup
  // ----------------------------------------------------
  async signup(input: SignupInput, ipAddress?: string, userAgent?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await this.hashPassword(input.password);
    const workspaceName = input.workspaceName || `${input.name.split(' ')[0]}'s Workspace`;
    const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // Create User, default personal Workspace, and OWNER Membership in transaction
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash,
        locale: 'en',
        timezone: 'UTC',
        memberships: {
          create: {
            role: MembershipRole.OWNER,
            workspace: {
              create: {
                name: workspaceName,
                slug,
                timezone: 'UTC',
                subscription: {
                  create: {
                    customerId: `cus_free_${Math.random().toString(36).substring(2, 9)}`,
                    planTier: 'FREE',
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    // Create Verification Token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verifyToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hrs
      },
    });

    // Send verification email with resilience: if SMTP is down, log failure and do not crash signup
    try {
      await this.sendVerificationEmail(user.email, user.name || 'Creator', verifyToken);
    } catch (err: any) {
      console.warn(
        `⚠️ [Verification Email Delivery Warning] Failed to dispatch verification email to ${user.email} (SMTP may be unreachable). Signup preserved: ${err?.message || err}`,
      );
    }

    const personalWorkspace = user.memberships[0]?.workspace;
    const tokens = this.generateTokenPair(user, personalWorkspace?.id);

    // Save session in DB
    await prisma.session.create({
      data: {
        sessionToken: tokens.refreshToken,
        userId: user.id,
        userAgent,
        ipAddress,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Log Audit
    await this.auditService.log({
      action: 'AUTH_SIGNUP',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      workspaceId: personalWorkspace?.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        locale: user.locale,
        timezone: user.timezone,
        emailVerified: user.emailVerified,
      },
      workspace: personalWorkspace,
      verificationToken: verifyToken,
      tokens,
    };
  }

  // ----------------------------------------------------
  // Email Verification Dispatch
  // ----------------------------------------------------
  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;
    console.log(`✉️ [Mailpit Dispatch] Verification email for ${email} (${name}): ${verifyUrl}`);
  }

  // ----------------------------------------------------
  // Login
  // ----------------------------------------------------
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const rateLimitKey = `${input.email}_${ipAddress || ''}`;
    this.checkRateLimit(rateLimitKey);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        twoFactor: true,
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    // Check if domain enforces enterprise SSO
    const domain = input.email.toLowerCase().split('@')[1];
    if (domain) {
      const sso = await prisma.ssoConnection.findUnique({
        where: { domain },
      });
      if (sso && sso.enforceSso) {
        throw new UnauthorizedException(
          `SSO is enforced for ${domain}. Please log in using your enterprise Single Sign-On provider.`,
        );
      }
    }

    if (!user || !user.passwordHash) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await this.verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactor) {
      if (!input.code) {
        return {
          requiresTwoFactor: true,
          userId: user.id,
          message: 'Two-factor authentication code required',
        };
      }

      const isValidTotp = authenticator.check(input.code, user.twoFactor.secret);
      const isRecoveryCode = user.twoFactor.recoveryCodes.includes(input.code);

      if (!isValidTotp && !isRecoveryCode) {
        this.recordFailedAttempt(rateLimitKey);
        throw new UnauthorizedException('Invalid 2FA code or recovery code');
      }

      // If recovery code used, consume it
      if (isRecoveryCode) {
        const remainingCodes = user.twoFactor.recoveryCodes.filter((c) => c !== input.code);
        await prisma.twoFactor.update({
          where: { userId: user.id },
          data: { recoveryCodes: remainingCodes },
        });
      }
    }

    this.clearFailedAttempts(rateLimitKey);

    const defaultWorkspace = user.memberships[0]?.workspace;
    const tokens = this.generateTokenPair(user, defaultWorkspace?.id);

    // Save session in DB
    await prisma.session.create({
      data: {
        sessionToken: tokens.refreshToken,
        userId: user.id,
        userAgent,
        ipAddress,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      action: 'AUTH_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      workspaceId: defaultWorkspace?.id,
      ipAddress,
      userAgent,
      metadata: { method: 'password' },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      currentWorkspace: defaultWorkspace,
      workspaces: user.memberships.map((m) => m.workspace),
      tokens,
    };
  }

  // ----------------------------------------------------
  // Refresh Token Rotation
  // ----------------------------------------------------
  async refreshTokens(oldRefreshToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const decoded = jwt.verify(oldRefreshToken, this.jwtRefreshSecret) as { userId: string };

      // Check if session exists in DB
      const session = await prisma.session.findUnique({
        where: { sessionToken: oldRefreshToken },
        include: {
          user: {
            include: {
              memberships: {
                include: { workspace: true },
              },
            },
          },
        },
      });

      if (!session || session.expires < new Date()) {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      }

      // Rotate: delete old session token and issue new pair
      await prisma.session.delete({ where: { id: session.id } });

      const newTokens = this.generateTokenPair(session.user, session.user.memberships[0]?.workspaceId);

      await prisma.session.create({
        data: {
          sessionToken: newTokens.refreshToken,
          userId: session.user.id,
          userAgent,
          ipAddress,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return newTokens;
    } catch {
      throw new UnauthorizedException('Refresh token rotation failed');
    }
  }

  // ----------------------------------------------------
  // Magic-Link Flow
  // ----------------------------------------------------
  async requestMagicLink(email: string) {
    const normalizedEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Auto-create user and workspace for magic link
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          locale: 'en',
          timezone: 'UTC',
          memberships: {
            create: {
              role: MembershipRole.OWNER,
              workspace: {
                create: {
                  name: `${normalizedEmail.split('@')[0]}'s Workspace`,
                  slug: `${normalizedEmail.split('@')[0]}-${Math.random().toString(36).substring(2, 6)}`,
                },
              },
            },
          },
        },
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      },
    });

    const magicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/magic-link?token=${token}`;
    console.log(`✉️ [Mailpit Dispatch] Magic link for ${normalizedEmail}: ${magicUrl}`);

    return { success: true, message: 'Magic link dispatched', devToken: token };
  }

  async verifyMagicLink(token: string, ipAddress?: string, userAgent?: string) {
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.expires < new Date()) {
      throw new BadRequestException('Magic link is invalid or expired');
    }

    const user = await prisma.user.findUnique({
      where: { email: record.identifier },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    // Mark email verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Consume verification token
    await prisma.verificationToken.delete({ where: { id: record.id } });

    const tokens = this.generateTokenPair(user, user.memberships[0]?.workspaceId);
    await prisma.session.create({
      data: {
        sessionToken: tokens.refreshToken,
        userId: user.id,
        userAgent,
        ipAddress,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, tokens };
  }

  // ----------------------------------------------------
  // Forgot / Reset Password
  // ----------------------------------------------------
  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) {
      // Don't disclose existence
      return { success: true, message: 'If an account exists, a reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: resetToken,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`✉️ [Mailpit Dispatch] Password reset link for ${user.email}: ${resetUrl}`);

    return {
      success: true,
      message: 'If an account exists, a reset link has been dispatched.',
      devToken: resetToken,
    };
  }

  async resetPassword(input: ResetPasswordInput, ipAddress?: string, userAgent?: string) {
    const record = await prisma.passwordResetToken.findUnique({ where: { token: input.token } });
    if (!record || record.expires < new Date()) {
      throw new BadRequestException('Password reset token is invalid or expired');
    }

    const newHash = await this.hashPassword(input.password);
    const user = await prisma.user.update({
      where: { email: record.email },
      data: { passwordHash: newHash },
    });

    // Invalidate all tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: record.email } });

    // Revoke all existing sessions on password change
    await prisma.session.deleteMany({ where: { userId: user.id } });

    await this.auditService.log({
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Password has been successfully updated' };
  }

  // ----------------------------------------------------
  // 2FA TOTP Setup & Verification
  // ----------------------------------------------------
  async setupTwoFactor(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const otpAuthUrl = authenticator.keyuri(user.email, 'Orbitly', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate 6 recovery backup codes
    const recoveryCodes = Array.from({ length: 6 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    await prisma.twoFactor.upsert({
      where: { userId },
      update: {
        secret,
        recoveryCodes,
        enabled: false,
      },
      create: {
        userId,
        secret,
        recoveryCodes,
        enabled: false,
      },
    });

    return {
      secret,
      qrCodeUrl: qrCodeDataUrl,
      recoveryCodes,
    };
  }

  async verifyAndEnableTwoFactor(userId: string, code: string) {
    const record = await prisma.twoFactor.findUnique({ where: { userId } });
    if (!record) {
      throw new BadRequestException('Two-factor setup has not been initiated');
    }

    const isValid = authenticator.check(code, record.secret);
    if (!isValid) {
      throw new BadRequestException('Invalid authentication code');
    }

    await prisma.$transaction([
      prisma.twoFactor.update({
        where: { userId },
        data: { enabled: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      }),
    ]);

    await this.auditService.log({
      action: 'AUTH_2FA_ENABLED',
      entityType: 'USER',
      entityId: userId,
      userId,
    });

    return { success: true, message: 'Two-factor authentication successfully enabled' };
  }

  // ----------------------------------------------------
  // Sessions Management
  // ----------------------------------------------------
  async listSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expires: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async logout(sessionToken: string) {
    await prisma.session.deleteMany({ where: { sessionToken } });
    return { success: true };
  }

  async logoutAll(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
    await this.auditService.log({
      action: 'AUTH_LOGOUT_ALL',
      entityType: 'USER',
      entityId: userId,
      userId,
    });
    return { success: true };
  }
}
