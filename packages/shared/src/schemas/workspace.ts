import { z } from 'zod';
import { MembershipRole } from '../types';

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
  timezone: z.string().default('UTC'),
});

export const RenameWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Please provide a valid email to invite').toLowerCase(),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.EDITOR),
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(10, 'Invitation token is invalid or missing'),
});

export const OnboardingProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
  timezone: z.string().min(1, 'Please select your timezone'),
  language: z.enum(['en', 'hi', 'es', 'fr', 'de', 'pt', 'ar']),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type RenameWorkspaceInput = z.infer<typeof RenameWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
export type OnboardingProfileInput = z.infer<typeof OnboardingProfileSchema>;
