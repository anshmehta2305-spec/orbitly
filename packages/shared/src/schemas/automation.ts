import { z } from 'zod';

export const AutomationTypeEnum = z.enum(['RECURRING', 'EVERGREEN', 'RSS', 'WEBHOOK']);
export const AutomationStatusEnum = z.enum(['ACTIVE', 'PAUSED', 'ERROR']);

export const RecurringConfigSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  time: z.string().default('09:00'),
  timezone: z.string().default('UTC'),
  template: z.string().min(1, 'Post template required'),
  tags: z.array(z.string()).default([]),
});

export const EvergreenConfigSchema = z.object({
  poolType: z.enum(['TAG', 'ALL_PUBLISHED']),
  tag: z.string().optional(),
  minGapDays: z.number().int().min(1).default(14),
  order: z.enum(['RANDOM', 'ROUND_ROBIN']).default('ROUND_ROBIN'),
  maxReuseCount: z.number().int().min(1).default(5),
});

export const RssConfigSchema = z.object({
  feedUrl: z.string().url('Valid RSS/Atom feed URL required'),
  pollIntervalMinutes: z.number().int().min(15).default(60),
  postAsDraft: z.boolean().default(true),
  template: z.string().default('{{title}}\n\n{{url}}'),
  tags: z.array(z.string()).default([]),
});

export const InboundWebhookConfigSchema = z.object({
  signingSecret: z.string().min(16),
  defaultStatus: z.enum(['DRAFT', 'SCHEDULED']).default('DRAFT'),
});

export const CreateAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: AutomationTypeEnum,
  channelIds: z.array(z.string()).min(1, 'Select at least one channel'),
  config: z.record(z.any()),
});

export type CreateAutomationInput = z.infer<typeof CreateAutomationSchema>;

export const UpdateAutomationSchema = CreateAutomationSchema.partial();
export type UpdateAutomationInput = z.infer<typeof UpdateAutomationSchema>;

export const DryRunAutomationSchema = z.object({
  type: AutomationTypeEnum,
  config: z.record(z.any()),
  channelIds: z.array(z.string()).default([]),
});

export type DryRunAutomationInput = z.infer<typeof DryRunAutomationSchema>;
