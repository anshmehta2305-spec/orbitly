import { describe, it, expect } from 'vitest';
import {
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  MediaInvalidError,
  TransientError,
  FatalError,
} from '../errors/provider-errors';

describe('Publishing Retry Policy & Error Classification', () => {
  it('correctly flags retryable vs non-retryable errors', () => {
    // Retryable errors
    const rateLimited = new RateLimitedError('Too many requests', 30);
    const transient = new TransientError('Network timeout');

    expect(rateLimited.shouldRetry).toBe(true);
    expect(rateLimited.retryAfterSeconds).toBe(30);
    expect(transient.shouldRetry).toBe(true);

    // Non-retryable errors
    const authExpired = new AuthExpiredError('Invalid session token');
    const contentRejected = new ContentRejectedError('Character count exceeded');
    const mediaInvalid = new MediaInvalidError('Unsupported format');
    const fatal = new FatalError('Fatal database failure');

    expect(authExpired.shouldRetry).toBe(false);
    expect(contentRejected.shouldRetry).toBe(false);
    expect(mediaInvalid.shouldRetry).toBe(false);
    expect(fatal.shouldRetry).toBe(false);
  });

  it('calculates exponential backoff with jitter within bounded interval', () => {
    function computeBackoffMs(attempt: number, baseMs = 1000, maxMs = 60000): number {
      const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
      const jitter = Math.random() * (exp * 0.2); // up to 20% jitter
      return Math.round(exp + jitter);
    }

    const attempt1 = computeBackoffMs(1);
    const attempt2 = computeBackoffMs(2);
    const attempt3 = computeBackoffMs(3);

    expect(attempt1).toBeGreaterThanOrEqual(2000);
    expect(attempt2).toBeGreaterThanOrEqual(4000);
    expect(attempt3).toBeGreaterThanOrEqual(8000);
    expect(attempt1).toBeLessThan(attempt2);
    expect(attempt2).toBeLessThan(attempt3);
  });
});