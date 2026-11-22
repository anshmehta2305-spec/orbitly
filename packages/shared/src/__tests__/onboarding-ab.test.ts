import { describe, it, expect } from 'vitest';
import {
  hashString,
  getOnboardingVariant,
  ONBOARDING_STEPS_CONFIG,
  FUNNEL_STAGES,
  FunnelEventType,
} from '../index';

describe('A/B Testing & Onboarding Configuration', () => {
  it('hashString should be completely deterministic', () => {
    const hash1 = hashString('user_123');
    const hash2 = hashString('user_123');
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('number');
  });

  it('hashString should produce varying positive hashes across distinct user IDs', () => {
    const hashA = hashString('usr_alpha_99');
    const hashB = hashString('usr_beta_100');
    expect(hashA).not.toBe(hashB);
    expect(hashA).toBeGreaterThanOrEqual(0);
    expect(hashB).toBeGreaterThanOrEqual(0);
  });

  it('getOnboardingVariant should allocate users deterministically into A or B', () => {
    const v1 = getOnboardingVariant('usr_test_1');
    const v2 = getOnboardingVariant('usr_test_1');
    expect(v1).toBe(v2);

    expect(['A', 'B']).toContain(v1);

    // Verify hash modulus boundary logic
    const bucket = hashString('usr_test_1') % 100;
    if (bucket < 50) {
      expect(v1).toBe('A');
    } else {
      expect(v1).toBe('B');
    }
  });

  it('ONBOARDING_STEPS_CONFIG should define the 5 standard activation milestones', () => {
    expect(ONBOARDING_STEPS_CONFIG).toBeDefined();
    expect(ONBOARDING_STEPS_CONFIG.length).toBe(5);

    const stepIds = ONBOARDING_STEPS_CONFIG.map((s) => s.id);
    expect(stepIds).toContain('connect_channel');
    expect(stepIds).toContain('create_post');
    expect(stepIds).toContain('schedule_post');
    expect(stepIds).toContain('try_ai');
    expect(stepIds).toContain('invite_teammate');
  });

  it('FUNNEL_STAGES should define the end-to-end activation milestones', () => {
    expect(FUNNEL_STAGES.length).toBe(6);
    const keys = FUNNEL_STAGES.map((s) => s.key);
    expect(keys).toEqual([
      'signup',
      'verified',
      'channel_connected',
      'first_post_scheduled',
      'first_post_published',
      'upgrade',
    ]);
  });

  it('FunnelEventType should match valid funnel stage keys', () => {
    const validEvents: FunnelEventType[] = [
      'signup',
      'verified',
      'channel_connected',
      'first_post_scheduled',
      'first_post_published',
      'upgrade',
    ];
    expect(validEvents.length).toBe(6);
  });
});
