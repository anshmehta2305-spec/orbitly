import { z } from 'zod';

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(3000),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).default([]),
  mediaUrls: z.array(z.string().url()).default([]),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(3000),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
