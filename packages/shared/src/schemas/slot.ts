import { z } from 'zod';

export const SlotSchema = z.object({
  channelId: z.string().optional().nullable(),
  weekday: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in 24h format (HH:MM)'),
  timezone: z.string().default('UTC'),
});

export const SetSlotsSchema = z.object({
  workspaceId: z.string().min(1),
  channelId: z.string().optional().nullable(),
  slots: z.array(SlotSchema),
});

export type SlotInput = z.infer<typeof SlotSchema>;
export type SetSlotsInput = z.infer<typeof SetSlotsSchema>;
