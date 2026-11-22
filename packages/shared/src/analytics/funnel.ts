/**
 * Consented, Privacy-Friendly Funnel Analytics Utility.
 * Tracks critical lifecycle milestones without third-party tracking cookies or PII.
 */

export type FunnelEventType =
  | 'signup'
  | 'verified'
  | 'channel_connected'
  | 'first_post_scheduled'
  | 'first_post_published'
  | 'upgrade';

export interface FunnelEventPayload {
  eventName: FunnelEventType;
  userId?: string;
  workspaceId?: string;
  properties?: {
    platform?: string;
    abVariant?: string;
    planTier?: string;
    source?: string;
    timeToFirstScheduleSec?: number;
    [key: string]: any;
  };
}

export const FUNNEL_STAGES: Array<{ key: FunnelEventType; label: string }> = [
  { key: 'signup', label: '1. User Signup' },
  { key: 'verified', label: '2. Email Verified' },
  { key: 'channel_connected', label: '3. Channel Connected' },
  { key: 'first_post_scheduled', label: '4. First Post Scheduled (<10m)' },
  { key: 'first_post_published', label: '5. First Post Published' },
  { key: 'upgrade', label: '6. Paid Plan Upgrade' },
];
