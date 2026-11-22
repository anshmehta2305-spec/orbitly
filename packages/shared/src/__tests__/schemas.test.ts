import { describe, it, expect } from 'vitest';
import { SignupSchema, LoginSchema } from '../schemas/auth';
import { CreateWorkspaceSchema, InviteMemberSchema } from '../schemas/workspace';
import { MembershipRole } from '../types';

describe('Zod Validation Schemas', () => {
  it('validates robust signup passwords', () => {
    const valid = SignupSchema.safeParse({
      name: 'John Orbit',
      email: 'john@example.com',
      password: 'SecurePassword123!',
    });
    expect(valid.success).toBe(true);

    const weakPassword = SignupSchema.safeParse({
      name: 'John Orbit',
      email: 'john@example.com',
      password: 'password', // no uppercase, no number
    });
    expect(weakPassword.success).toBe(false);
  });

  it('validates workspace invitations', () => {
    const valid = InviteMemberSchema.safeParse({
      email: 'teammate@company.com',
      role: MembershipRole.EDITOR,
    });
    expect(valid.success).toBe(true);

    const invalid = InviteMemberSchema.safeParse({
      email: 'invalid-email',
      role: 'SUPERADMIN',
    });
    expect(invalid.success).toBe(false);
  });
});
