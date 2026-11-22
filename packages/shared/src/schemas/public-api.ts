import { z } from 'zod';
import { API_KEY_SCOPES } from '../security/api-key';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Key name required').max(100),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1, 'At least one scope is required'),
  expiresAt: z.string().datetime().optional(),
  ipAllowlist: z.array(z.string()).default([]),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const CreateOutboundWebhookSchema = z.object({
  url: z.string().url('Valid webhook URL required'),
  events: z.array(z.enum([
    'post.scheduled',
    'post.published',
    'post.failed',
    'post.approved',
    'channel.needs_reauth',
  ])).min(1, 'Select at least one event'),
});

export type CreateOutboundWebhookInput = z.infer<typeof CreateOutboundWebhookSchema>;

export const PublicApiPostCreateSchema = z.object({
  channelIds: z.array(z.string()).min(1, 'At least one channel ID required'),
  content: z.string().min(1, 'Post content required').max(5000),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledAt: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
  idempotencyKey: z.string().optional(),
});

export type PublicApiPostCreateInput = z.infer<typeof PublicApiPostCreateSchema>;

export const PublicApiCursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});
