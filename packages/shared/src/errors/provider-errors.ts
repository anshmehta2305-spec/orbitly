export abstract class ProviderError extends Error {
  public abstract readonly code: string;
  public abstract readonly shouldRetry: boolean;
  public readonly retryAfterSeconds?: number;
  public abstract readonly retryGuidance: string;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = this.constructor.name;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Access token or credentials expired; requires re-authentication or refresh
 */
export class AuthExpiredError extends ProviderError {
  public readonly code = 'AUTH_EXPIRED';
  public readonly shouldRetry = false;
  public readonly retryGuidance = 'The social account credentials have expired. Re-authenticate the channel.';

  constructor(message: string = 'Channel authorization expired or revoked') {
    super(message);
  }
}

/**
 * Rate limit hit on provider API
 */
export class RateLimitedError extends ProviderError {
  public readonly code = 'RATE_LIMITED';
  public readonly shouldRetry = true;
  public readonly retryGuidance = 'Platform rate limit encountered. Wait for the cooldown window before retrying.';

  constructor(message: string = 'Rate limit exceeded by provider', retryAfterSeconds: number = 300) {
    super(message, retryAfterSeconds);
  }
}

/**
 * Platform rejected post due to policy, banned link, or character constraint
 */
export class ContentRejectedError extends ProviderError {
  public readonly code = 'CONTENT_REJECTED';
  public readonly shouldRetry = false;
  public readonly retryGuidance = 'Platform rejected the post content. Review character limits, banned URLs, or community guidelines.';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Media format, resolution or size violates platform constraints
 */
export class MediaInvalidError extends ProviderError {
  public readonly code = 'MEDIA_INVALID';
  public readonly shouldRetry = false;
  public readonly retryGuidance = 'Media file violates platform aspect ratio, duration, or size requirements.';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Transient server error (502, 503, 504, timeout) on provider side
 */
export class TransientError extends ProviderError {
  public readonly code = 'TRANSIENT_ERROR';
  public readonly shouldRetry = true;
  public readonly retryGuidance = 'Provider service temporarily unavailable. Job will be retried automatically with exponential backoff.';

  constructor(message: string = 'Upstream provider temporarily unavailable', retryAfterSeconds: number = 60) {
    super(message, retryAfterSeconds);
  }
}

/**
 * Fatal unrecoverable error (e.g. account suspended, deleted channel)
 */
export class FatalError extends ProviderError {
  public readonly code = 'FATAL_ERROR';
  public readonly shouldRetry = false;
  public readonly retryGuidance = 'Fatal error on platform side. Check that the target account or webhook is still active.';

  constructor(message: string) {
    super(message);
  }
}
