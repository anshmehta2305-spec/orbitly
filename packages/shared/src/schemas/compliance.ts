import { z } from 'zod';

export const DataRetentionPolicySchema = z.object({
  analyticsRetentionDays: z.number().int().min(30).max(1825).default(365),
  auditLogRetentionDays: z.number().int().min(30).max(3650).default(365),
  deletedPostRetentionDays: z.number().int().min(1).max(90).default(30),
  legalHold: z.boolean().default(false),
});

export type DataRetentionPolicyInput = z.infer<typeof DataRetentionPolicySchema>;

export const DataExportRequestSchema = z.object({
  format: z.enum(['JSON', 'CSV']).default('JSON'),
});

export type DataExportRequestInput = z.infer<typeof DataExportRequestSchema>;

export const RightToBeForgottenSchema = z.object({
  confirmEmail: z.string().email(),
  reason: z.string().max(500).optional(),
});

export type RightToBeForgottenInput = z.infer<typeof RightToBeForgottenSchema>;

export const EmailDomainVerificationSchema = z.object({
  emailDomain: z.string().min(3).max(255).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Invalid domain format'),
});

export type EmailDomainVerificationInput = z.infer<typeof EmailDomainVerificationSchema>;

export const CustomDomainSslSchema = z.object({
  customDomain: z.string().min(3).max(255),
});

export type CustomDomainSslInput = z.infer<typeof CustomDomainSslSchema>;
