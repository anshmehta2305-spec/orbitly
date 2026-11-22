/**
 * Deterministic A/B Testing & Feature Flag Evaluation Utility.
 * Evaluates variants deterministically based on user ID hashing without cookies or third-party trackers.
 */

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export type OnboardingVariant = 'A' | 'B';

/**
 * Returns deterministic A/B variant for onboarding flow:
 * - Variant A: "Guided First-Post Flow" (pre-filled sample post and immediate recommended channel connect)
 * - Variant B: "Checklist Widget First" (dashboard checklist card with progress meter)
 */
export function getOnboardingVariant(userId: string): OnboardingVariant {
  if (!userId) return 'A';
  const bucket = hashString(userId) % 100;
  return bucket < 50 ? 'A' : 'B';
}

export interface OnboardingStep {
  id: 'connect_channel' | 'create_post' | 'schedule_post' | 'invite_teammate' | 'try_ai';
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
}

export const ONBOARDING_STEPS_CONFIG = [
  {
    id: 'connect_channel' as const,
    title: 'Connect your first social channel',
    description: 'Link your LinkedIn, X, Bluesky, or Instagram account in 1-click.',
    href: '/channels',
  },
  {
    id: 'create_post' as const,
    title: 'Draft your first cross-platform post',
    description: 'Use the global composer to draft a post with rich media or threads.',
    href: '/calendar?composer=true',
  },
  {
    id: 'schedule_post' as const,
    title: 'Schedule a post for the optimal time',
    description: 'Choose a date on the calendar or click the AI Best Time helper.',
    href: '/calendar',
  },
  {
    id: 'try_ai' as const,
    title: 'Generate copy with AI Studio',
    description: 'Craft viral hooks, hashtags, or blog-to-post summaries in seconds.',
    href: '/ai',
  },
  {
    id: 'invite_teammate' as const,
    title: 'Invite a teammate or client',
    description: 'Collaborate with multi-stage review workflows and share links.',
    href: '/team',
  },
];
