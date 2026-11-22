import { z } from 'zod';
import { SocialProvider, PostPayload, NormalizedPostPayload } from '../types/provider';
import { ContentRejectedError, MediaInvalidError } from '../errors/provider-errors';

export const MediaItemSchema = z.object({
  url: z.string().url(),
  mimeType: z.string(),
  altText: z.string().max(1000).optional(),
  sizeBytes: z.number().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const PostPayloadSchema = z.object({
  text: z.string(),
  media: z.array(MediaItemSchema).optional().default([]),
  thread: z.array(z.string()).optional().default([]),
  firstComment: z.string().optional(),
  poll: z
    .object({
      options: z.array(z.string().min(1)).min(2).max(4),
      durationMinutes: z.number().min(5).max(10080),
    })
    .optional(),
  settings: z.record(z.any()).optional().default({}),
});

/**
 * Normalizes post payload against provider limits and capabilities,
 * trimming text safely and accumulating warnings.
 */
export function normalizePayload(provider: SocialProvider, raw: PostPayload): NormalizedPostPayload {
  const parsed = PostPayloadSchema.parse(raw);
  const warnings: string[] = [];
  let text = parsed.text;
  let truncated = false;
  const originalTextLength = text.length;

  // 1. Text length validation & safe truncation
  if (text.length > provider.limits.maxChars) {
    text = text.slice(0, provider.limits.maxChars);
    truncated = true;
    warnings.push(
      `Text exceeded ${provider.limits.maxChars} chars for ${provider.name}; safely truncated from ${originalTextLength} characters.`,
    );
  }

  // 2. Media capabilities & count check
  const media = parsed.media || [];
  if (media.length > 0 && !provider.capabilities.images && !provider.capabilities.video) {
    throw new MediaInvalidError(`${provider.name} does not support media attachments.`);
  }

  if (media.length > provider.limits.maxImages) {
    warnings.push(
      `Media count (${media.length}) exceeds ${provider.limits.maxImages} allowed by ${provider.name}. Extra attachments will be dropped.`,
    );
  }

  // 3. Threads check
  const thread = parsed.thread || [];
  if (thread.length > 0 && !provider.capabilities.threads) {
    warnings.push(`${provider.name} does not support threads; only the primary post will publish.`);
  }

  // 4. First comment check
  let firstComment = parsed.firstComment;
  if (firstComment && !provider.capabilities.firstComment) {
    warnings.push(`${provider.name} does not support automated first-comments; first comment was omitted.`);
    firstComment = undefined;
  }

  return {
    ...parsed,
    text,
    firstComment,
    warnings,
    originalTextLength,
    truncated,
  };
}
