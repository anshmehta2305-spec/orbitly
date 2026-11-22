import { z } from 'zod';
import { ChannelProvider, ChannelStatus } from '../types';

export const ConnectCredentialsSchema = z.object({
  provider: z.nativeEnum(ChannelProvider),
  // Bluesky
  identifier: z.string().min(3).optional(),
  appPassword: z.string().min(8).optional(),
  // Mastodon
  instanceUrl: z.string().url().optional(),
  accessToken: z.string().optional(),
  // Telegram
  botToken: z.string().min(10).optional(),
  chatId: z.string().min(2).optional(),
  // Discord
  webhookUrl: z.string().url().optional(),
});

export const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Invalid hex color code').optional(),
  timezone: z.string().optional(),
  defaultHashtags: z.array(z.string()).optional(),
  signature: z.string().max(200).optional(),
  status: z.nativeEnum(ChannelStatus).optional(),
});

export const ChannelFilterSchema = z.object({
  provider: z.nativeEnum(ChannelProvider).optional(),
  status: z.nativeEnum(ChannelStatus).optional(),
});

export type ConnectCredentialsInput = z.infer<typeof ConnectCredentialsSchema>;
export type UpdateChannelInput = z.infer<typeof UpdateChannelSchema>;
export type ChannelFilterInput = z.infer<typeof ChannelFilterSchema>;
