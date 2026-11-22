import { z } from 'zod';
import { PostStatus } from '../types';

export const PostVariantInputSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  content: z.string().min(1, 'Content is required'),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  thread: z.array(z.string()).optional().default([]),
  firstComment: z.string().optional(),
  settings: z.record(z.any()).optional().default({}),
});

export const CreatePostSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  title: z.string().max(200).optional(),
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.date().optional().nullable()),
  timezone: z.string().default('UTC'),
  tags: z.array(z.string()).optional().default([]),
  campaign: z.string().optional(),
  postNow: z.boolean().optional().default(false),
  submitForApproval: z.boolean().optional().default(false),
  variants: z
    .array(PostVariantInputSchema)
    .min(1, 'At least one channel variant must be selected'),
});

export const UpdatePostSchema = z.object({
  title: z.string().max(200).optional(),
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.date().optional().nullable()),
  timezone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  campaign: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  variants: z.array(PostVariantInputSchema).optional(),
});

export const PostFilterSchema = z.object({
  workspaceId: z.string().min(1),
  channelId: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  authorId: z.string().optional(),
  tag: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const BulkPostActionSchema = z.object({
  workspaceId: z.string().min(1),
  postIds: z.array(z.string().cuid()).min(1, 'Select at least one post'),
  action: z.enum(['reschedule', 'delete', 'change_status']),
  newScheduledAt: z.string().datetime({ offset: true }).optional(),
  rescheduleOffsetMinutes: z.number().int().optional(),
  newStatus: z.nativeEnum(PostStatus).optional(),
});

export const CsvRowSchema = z.object({
  text: z.string().min(1, 'Post text is required'),
  channels: z.string().min(1, 'At least one channel is required'),
  datetime: z.string().min(1, 'Date and time is required'),
  mediaUrl: z.string().optional(),
  tags: z.string().optional(),
});

export type PostVariantInput = z.infer<typeof PostVariantInputSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type PostFilterInput = z.infer<typeof PostFilterSchema>;
export type BulkPostActionInput = z.infer<typeof BulkPostActionSchema>;
export type CsvRowInput = z.infer<typeof CsvRowSchema>;
