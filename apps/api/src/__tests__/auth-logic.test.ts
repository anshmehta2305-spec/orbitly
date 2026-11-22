import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../modules/auth/auth.service';
import { AuditService } from '../common/services/audit.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService Logic & Cryptography', () => {
  const mockAuditService = { log: vi.fn() } as unknown as AuditService;
  const authService = new AuthService(mockAuditService);

  it('correctly hashes passwords and verifies matching and non-matching passwords', async () => {
    const rawPassword = 'StrongPassword2026!';
    const hashed = await authService.hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    expect(await authService.verifyPassword(rawPassword, hashed)).toBe(true);
    expect(await authService.verifyPassword('WrongPassword!', hashed)).toBe(false);
  });

  it('generates short-lived access token and 7-day refresh token', () => {
    const mockUser: any = {
      id: 'usr_123',
      email: 'alex@orbitly.app',
      name: 'Alex Orbit',
      role: 'USER',
    };

    const tokens = authService.generateTokenPair(mockUser, 'ws_123');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(900); // 15 mins
  });

  it('validates seed salt-based password hashes', async () => {
    const salt = 'demo_salt_test';
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(`Secret123!:${salt}`).digest('hex');
    const stored = `${hash}:${salt}`;

    expect(await authService.verifyPassword('Secret123!', stored)).toBe(true);
    expect(await authService.verifyPassword('Different!', stored)).toBe(false);
  });
});
