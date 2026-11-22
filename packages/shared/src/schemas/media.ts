import { z } from 'zod';

export const PresignMediaSchema = z.object({
  workspaceId: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  folder: z.string().optional().default('root'),
});

export const CompleteMediaSchema = z.object({
  workspaceId: z.string().min(1),
  s3Key: z.string().min(1),
  url: z.string().url(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  altText: z.string().max(1000).optional(),
  folder: z.string().optional().default('root'),
});

export type PresignMediaInput = z.infer<typeof PresignMediaSchema>;
export type CompleteMediaInput = z.infer<typeof CompleteMediaSchema>;
