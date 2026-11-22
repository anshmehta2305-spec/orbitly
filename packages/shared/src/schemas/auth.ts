import { z } from 'zod';

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(64),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  workspaceName: z.string().min(2).max(50).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, '2FA code must be 6 digits').optional(),
});

export const MagicLinkRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const VerifyTwoFactorSchema = z.object({
  code: z.string().min(6).max(8, 'Code must be 6-digit TOTP or 8-character recovery code'),
});

export const TwoFactorSetupResponseSchema = z.object({
  secret: z.string(),
  qrCodeUrl: z.string(),
  recoveryCodes: z.array(z.string()),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type MagicLinkRequestInput = z.infer<typeof MagicLinkRequestSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyTwoFactorInput = z.infer<typeof VerifyTwoFactorSchema>;
