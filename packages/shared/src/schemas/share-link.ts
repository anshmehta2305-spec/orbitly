import { z } from 'zod';
import { ShareScope } from '../types';

export const CreateShareLinkSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  scope: z.nativeEnum(ShareScope).default(ShareScope.CALENDAR),
  channelIds: z.array(z.string()).default([]),
  dateFrom: z.string().datetime().optional().nullable(),
  dateTo: z.string().datetime().optional().nullable(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  allowComments: z.boolean().default(true),
  allowApprove: z.boolean().default(false),
});

export type CreateShareLinkInput = z.infer<typeof CreateShareLinkSchema>;

export const UpdateShareLinkSchema = CreateShareLinkSchema.partial();

export type UpdateShareLinkInput = z.infer<typeof UpdateShareLinkSchema>;

// Public portal schemas
export const VerifySharePasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type VerifySharePasswordInput = z.infer<typeof VerifySharePasswordSchema>;

export const RegisterShareReviewerSchema = z.object({
  name: z.string().min(1, 'Your name is required').max(100),
  email: z.string().email('A valid email is required'),
});

export type RegisterShareReviewerInput = z.infer<typeof RegisterShareReviewerSchema>;

export const PublicShareCommentSchema = z.object({
  reviewerName: z.string().min(1),
  reviewerEmail: z.string().email(),
  content: z.string().min(1, 'Comment cannot be empty').max(3000),
  parentId: z.string().optional(),
  mediaUrls: z.array(z.string().url()).default([]),
});

export type PublicShareCommentInput = z.infer<typeof PublicShareCommentSchema>;

export const PublicShareDecideSchema = z.object({
  reviewerName: z.string().min(1),
  reviewerEmail: z.string().email(),
  decision: z.enum(['APPROVE', 'REQUEST_CHANGES']),
  note: z.string().max(1000).optional(),
});

export type PublicShareDecideInput = z.infer<typeof PublicShareDecideSchema>;
