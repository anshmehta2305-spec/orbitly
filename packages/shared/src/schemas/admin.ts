import { z } from 'zod';
import { PlanTier } from '../types';

export const UpdateUserAdminSchema = z.object({
  isDisabled: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  platformRole: z.enum(['SUPERADMIN', 'SUPPORT']).nullable().optional(),
});

export const OverrideWorkspacePlanSchema = z.object({
  planTier: z.nativeEnum(PlanTier),
  expiresAt: z.string().datetime().optional(),
  note: z.string().min(3).max(500),
});

export const CreateFeatureFlagSchema = z.object({
  key: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isEnabled: z.boolean().default(false),
  plans: z.array(z.nativeEnum(PlanTier)).default([]),
  workspaceIds: z.array(z.string()).default([]),
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(2).max(2000),
  type: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('INFO'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});
