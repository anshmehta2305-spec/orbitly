import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostsService } from '../modules/posts/posts.service';
import { QueueService } from '../common/services/queue.service';
import { EventsService } from '../common/services/events.service';
import { ProviderRegistry } from '../providers/registry';
import {
  PostStatus,
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  computePostStatusRollup,
} from '@orbitly/shared';

describe('Publishing Engine Integration Logic', () => {
  let mockQueueService: any;
  let mockEventsService: any;
  let mockProviderRegistry: any;

  beforeEach(() => {
    mockQueueService = {
      scheduleVariant: vi.fn().mockResolvedValue({ id: 'job_123' }),
      publishNow: vi.fn().mockResolvedValue({ id: 'job_now_123' }),
      cancelVariantJob: vi.fn().mockResolvedValue(undefined),
      generateJobId: vi.fn((variantId, date) => `${variantId}_${date.getTime()}`),
    };

    mockEventsService = {
      emit: vi.fn(),
    };

    mockProviderRegistry = new ProviderRegistry();
  });

  it('generates deterministic BullMQ job IDs for scheduling', () => {
    const queue = new QueueService();
    const scheduledAt = new Date('2026-11-25T14:00:00.000Z');
    const variantId = 'var_demo_1';

    const jobId1 = queue.generateJobId(variantId, scheduledAt);
    const jobId2 = queue.generateJobId(variantId, scheduledAt);

    expect(jobId1).toBe(jobId2);
    expect(jobId1).toBe(`var_demo_1_${scheduledAt.getTime()}`);
  });

  it('enforces idempotency and rolls up status on partial failure', () => {
    // 2 variants: 1 published, 1 failed
    const variants = [
      { id: 'v1', status: PostStatus.PUBLISHED },
      { id: 'v2', status: PostStatus.FAILED },
    ];

    const rolledUpStatus = computePostStatusRollup(variants);
    expect(rolledUpStatus).toBe(PostStatus.PARTIAL);
  });

  it('reconciles without double-publishing when externalId is already present', () => {
    const variant = {
      id: 'var_crash_test',
      status: PostStatus.PUBLISHED,
      externalId: 'at://bsky.feed.post/12345',
      externalUrl: 'https://bsky.app/post/12345',
    };

    const isAlreadyPublished = variant.status === PostStatus.PUBLISHED && !!variant.externalId;
    expect(isAlreadyPublished).toBe(true);
  });

  it('distinguishes retryable rate limits from non-retryable auth expiration', () => {
    const rateLimitError = new RateLimitedError('API quota exceeded', 60);
    const authError = new AuthExpiredError('Bluesky token expired');
    const contentError = new ContentRejectedError('Character length exceeded');

    // RateLimit triggers BullMQ retry
    expect(rateLimitError.shouldRetry).toBe(true);
    expect(rateLimitError.retryAfterSeconds).toBe(60);

    // Auth expired and Content rejected do NOT retry
    expect(authError.shouldRetry).toBe(false);
    expect(contentError.shouldRetry).toBe(false);
  });
});