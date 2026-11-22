import { z } from 'zod';
import { MembershipRole } from '../types';

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(MembershipRole),
  channelIds: z.array(z.string()).optional(),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

export const TransferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner ID is required'),
});

export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>;
