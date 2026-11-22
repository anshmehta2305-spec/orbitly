import { z } from 'zod';

export const AnalyticsOverviewQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  channelId: z.string().optional(),
  compareWithPrevious: z.boolean().default(true),
});

export type AnalyticsOverviewQuery = z.infer<typeof AnalyticsOverviewQuerySchema>;

export const AnalyticsExportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  channelId: z.string().optional(),
});

export type AnalyticsExportQuery = z.infer<typeof AnalyticsExportQuerySchema>;

export const ScheduleReportSchema = z.object({
  frequency: z.enum(['MONTHLY', 'WEEKLY']).default('MONTHLY'),
  recipients: z.array(z.string().email()).min(1),
  channelIds: z.array(z.string()).default([]),
});

export type ScheduleReportInput = z.infer<typeof ScheduleReportSchema>;
