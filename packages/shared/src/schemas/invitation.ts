import { z } from 'zod';
import { MembershipRole } from '../types';

export const CreateInvitationSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.EDITOR),
  channelIds: z.array(z.string()).optional(),
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const BulkInvitationSchema = z.object({
  emails: z.array(z.string().email('Valid email required')).min(1, 'At least one email is required'),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.EDITOR),
  channelIds: z.array(z.string()).optional(),
});

export type BulkInvitationInput = z.infer<typeof BulkInvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;
