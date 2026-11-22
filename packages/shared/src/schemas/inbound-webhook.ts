import { z } from 'zod';

export const InboundWebhookPayloadSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Post content is required').max(5000),
  channelIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  mediaUrls: z.array(z.string().url()).default([]),
  idempotencyKey: z.string().optional(),
});

export type InboundWebhookPayload = z.infer<typeof InboundWebhookPayloadSchema>;

export const CreateWebhookEndpointSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateWebhookEndpointInput = z.infer<typeof CreateWebhookEndpointSchema>;
