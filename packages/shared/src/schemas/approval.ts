import { z } from 'zod';

export const SubmitForApprovalSchema = z.object({
  note: z.string().max(1000).optional(),
});

export type SubmitForApprovalInput = z.infer<typeof SubmitForApprovalSchema>;

export const ApprovePostSchema = z.object({
  note: z.string().max(1000).optional(),
});

export type ApprovePostInput = z.infer<typeof ApprovePostSchema>;

export const RequestChangesSchema = z.object({
  note: z.string().min(1, 'Please provide feedback explaining the requested changes').max(1000),
});

export type RequestChangesInput = z.infer<typeof RequestChangesSchema>;

export const RejectPostSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

export type RejectPostInput = z.infer<typeof RejectPostSchema>;

export const BulkApproveSchema = z.object({
  postIds: z.array(z.string()).min(1, 'At least one post ID is required'),
  note: z.string().max(1000).optional(),
});

export type BulkApproveInput = z.infer<typeof BulkApproveSchema>;
