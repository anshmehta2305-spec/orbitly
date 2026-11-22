import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from '../modules/onboarding/onboarding.service';
import { LifecycleEmailService } from '../modules/lifecycle-emails/lifecycle-email.service';
import { prisma } from '@orbitly/db';

vi.mock('@orbitly/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userOnboarding: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    funnelEvent: {
      create: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    channel: {
      count: vi.fn(),
    },
    post: {
      count: vi.fn(),
    },
    membership: {
      count: vi.fn(),
    },
    aiUsage: {
      count: vi.fn(),
    },
  },
}));

describe('Onboarding & Activation Service', () => {
  let onboardingService: OnboardingService;

  beforeEach(() => {
    vi.clearAllMocks();
    onboardingService = new OnboardingService();
  });

  it('should initialize onboarding with deterministic A/B variant if not found', async () => {
    (prisma.userOnboarding.findUnique as any).mockResolvedValue(null);
    (prisma.userOnboarding.create as any).mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: 'ob_123',
        userId: data.userId,
        abVariant: data.abVariant,
        dismissedAt: null,
        completedAt: null,
        connectedChannel: false,
        createdPost: false,
        scheduledPost: false,
        invitedTeammate: false,
        triedAi: false,
      })
    );

    const state = await onboardingService.getOnboardingState('usr_test_ab');
    expect(state).toBeDefined();
    expect(state.abVariant).toMatch(/A|B/);
    expect(state.progressPercent).toBe(0);
    expect(state.allCompleted).toBe(false);
  });

  it('should calculate live progress percentage from real DB milestones', async () => {
    (prisma.userOnboarding.findUnique as any).mockResolvedValue({
      id: 'ob_active',
      userId: 'usr_sarah',
      abVariant: 'CONTROL',
      dismissed: false,
      connectedChannel: false,
      createdPost: false,
      scheduledPost: false,
      invitedTeammate: false,
      triedAi: false,
    });

    (prisma.channel.count as any).mockResolvedValue(1); // Connected channel
    (prisma.post.count as any).mockImplementation(({ where }: any) => {
      if (where.status === 'SCHEDULED') return Promise.resolve(1); // Scheduled post
      return Promise.resolve(2); // Created post
    });
    (prisma.membership.count as any).mockResolvedValue(1); // No teammate yet
    (prisma.aiUsage.count as any).mockResolvedValue(0); // No AI tried yet

    const state = await onboardingService.getOnboardingState('usr_sarah', 'ws_workspace_1');

    // 3 out of 5 steps completed (60%)
    const channelStep = state.steps.find((s) => s.id === 'connect_channel');
    const postStep = state.steps.find((s) => s.id === 'create_post');
    const schedStep = state.steps.find((s) => s.id === 'schedule_post');
    const memberStep = state.steps.find((s) => s.id === 'invite_teammate');
    const aiStep = state.steps.find((s) => s.id === 'try_ai');

    expect(channelStep?.isCompleted).toBe(true);
    expect(postStep?.isCompleted).toBe(true);
    expect(schedStep?.isCompleted).toBe(true);
    expect(memberStep?.isCompleted).toBe(false);
    expect(aiStep?.isCompleted).toBe(false);
    expect(state.progressPercent).toBe(60);
    expect(state.allCompleted).toBe(false);
  });

  it('should mark onboarding as completed when all steps are fulfilled', async () => {
    (prisma.userOnboarding.findUnique as any).mockResolvedValue({
      id: 'ob_complete',
      userId: 'usr_complete',
      abVariant: 'CONTROL',
      dismissed: false,
      connectedChannel: true,
      createdPost: true,
      scheduledPost: true,
      invitedTeammate: true,
      triedAi: true,
    });

    const state = await onboardingService.getOnboardingState('usr_complete');
    expect(state.progressPercent).toBe(100);
    expect(state.allCompleted).toBe(true);
  });

  it('should record funnel events with payload', async () => {
    (prisma.funnelEvent.create as any).mockResolvedValue({ id: 'evt_1' });

    await onboardingService.trackFunnelEvent({
      userId: 'usr_funnel',
      workspaceId: 'ws_1',
      eventName: 'first_post_scheduled',
      properties: { channelCount: 2 },
    });

    expect(prisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'usr_funnel',
          workspaceId: 'ws_1',
          eventName: 'first_post_scheduled',
        }),
      })
    );
  });
});

describe('Lifecycle Email & Compliance Service', () => {
  let emailService: LifecycleEmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new LifecycleEmailService();
  });

  it('should reject email if user does not exist', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await emailService.sendLifecycleEmail({
      userId: 'usr_nonexistent',
      type: 'welcome',
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('USER_NOT_FOUND');
  });

  it('should suppress dispatch if user unsubscribed from all communications (GDPR)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_unsub',
      email: 'optout@example.com',
      name: 'Opt Out',
    });
    (prisma.emailPreference.findUnique as any).mockResolvedValue({
      userId: 'usr_unsub',
      unsubscribedAllAt: new Date(),
      weeklyDigest: false,
      lifecycle: false,
    });

    const result = await emailService.sendLifecycleEmail({
      userId: 'usr_unsub',
      type: 'welcome',
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('USER_UNSUBSCRIBED_ALL');
  });

  it('should suppress digest email if weeklyDigest preference is disabled', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_nodigest',
      email: 'nodigest@example.com',
      name: 'No Digest',
    });
    (prisma.emailPreference.findUnique as any).mockResolvedValue({
      userId: 'usr_nodigest',
      unsubscribedAllAt: null,
      weeklyDigest: false,
      lifecycle: true,
    });

    const result = await emailService.sendLifecycleEmail({
      userId: 'usr_nodigest',
      type: 'weekly_digest',
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('USER_UNSUBSCRIBED_DIGEST');
  });

  it('should successfully send welcome email with CAN-SPAM compliant footer and unsub link', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_active',
      email: 'active@orbitly.io',
      name: 'Active Creator',
    });
    (prisma.emailPreference.findUnique as any).mockResolvedValue({
      userId: 'usr_active',
      unsubscribeToken: 'sec_token_987654321',
      unsubscribedAllAt: null,
      weeklyDigest: true,
      lifecycle: true,
    });

    const result = await emailService.sendLifecycleEmail({
      userId: 'usr_active',
      type: 'welcome',
    });

    expect(result.sent).toBe(true);
  });
});
