import { z } from 'zod';
import { ApprovalMode } from '../types';

export const UpdateWorkspaceSettingsSchema = z.object({
  approvalRequired: z.boolean().optional(),
  approvalMode: z.nativeEnum(ApprovalMode).optional(),
  approverIds: z.array(z.string()).optional(),
  autoPublishAfterApproval: z.boolean().optional(),
  defaultTimezone: z.string().optional(),
  brandName: z.string().max(100).nullable().optional(),
  brandLogo: z.string().url().nullable().optional(),
  brandColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color').nullable().optional(),
  customDomain: z.string().max(255).nullable().optional(),
});

export type UpdateWorkspaceSettingsInput = z.infer<typeof UpdateWorkspaceSettingsSchema>;
