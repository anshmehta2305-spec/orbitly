import { describe, it, expect } from 'vitest';
import { normalizePayload } from '../schemas/payload';
import { SocialProvider } from '../types/provider';
import { MediaInvalidError } from '../errors/provider-errors';

const mockBlueskyProvider: SocialProvider = {
  id: 'bluesky',
  name: 'Bluesky',
  authType: 'credentials',
  capabilities: {
    text: true,
    images: true,
    video: false,
    carousel: false,
    threads: true,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: {
    maxChars: 300,
    maxImages: 4,
    maxVideoMb: 0,
  },
  validate: async () => ({ ok: true }),
  publish: async () => ({ externalId: 'bsky_123' }),
};

const mockTextOnlyProvider: SocialProvider = {
  id: 'text_only',
  name: 'TextOnlyPlatform',
  authType: 'token',
  capabilities: {
    text: true,
    images: false,
    video: false,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: {
    maxChars: 100,
    maxImages: 0,
    maxVideoMb: 0,
  },
  validate: async () => ({ ok: true }),
  publish: async () => ({ externalId: 'txt_123' }),
};

describe('Payload Normalizer', () => {
  it('passes short post within limits without truncation', () => {
    const raw = {
      text: 'Hello Bluesky! Testing normalizer.',
    };

    const normalized = normalizePayload(mockBlueskyProvider, raw);
    expect(normalized.text).toBe('Hello Bluesky! Testing normalizer.');
    expect(normalized.truncated).toBe(false);
    expect(normalized.warnings.length).toBe(0);
  });

  it('safely truncates text exceeding provider maxChars and returns warning', () => {
    const longText = 'A'.repeat(350);
    const raw = { text: longText };

    const normalized = normalizePayload(mockBlueskyProvider, raw);
    expect(normalized.text.length).toBe(300);
    expect(normalized.truncated).toBe(true);
    expect(normalized.originalTextLength).toBe(350);
    expect(normalized.warnings[0]).toContain('safely truncated from 350 characters');
  });

  it('throws MediaInvalidError if provider does not support media attachments', () => {
    const raw = {
      text: 'Test post',
      media: [{ url: 'https://cdn.orbitly.app/photo.png', mimeType: 'image/png' }],
    };

    expect(() => normalizePayload(mockTextOnlyProvider, raw)).toThrow(MediaInvalidError);
  });

  it('warns when media count exceeds maxImages limit', () => {
    const raw = {
      text: 'Photo album',
      media: [
        { url: 'https://cdn.orbitly.app/1.jpg', mimeType: 'image/jpeg' },
        { url: 'https://cdn.orbitly.app/2.jpg', mimeType: 'image/jpeg' },
        { url: 'https://cdn.orbitly.app/3.jpg', mimeType: 'image/jpeg' },
        { url: 'https://cdn.orbitly.app/4.jpg', mimeType: 'image/jpeg' },
        { url: 'https://cdn.orbitly.app/5.jpg', mimeType: 'image/jpeg' },
      ],
    };

    const normalized = normalizePayload(mockBlueskyProvider, raw);
    expect(normalized.warnings.some((w) => w.includes('Media count (5) exceeds 4'))).toBe(true);
  });

  it('warns and omits first comment if provider does not support firstComment capability', () => {
    const raw = {
      text: 'Main announcement',
      firstComment: 'Link in first comment: https://orbitly.app',
    };

    const normalized = normalizePayload(mockBlueskyProvider, raw);
    expect(normalized.firstComment).toBeUndefined();
    expect(normalized.warnings.some((w) => w.includes('does not support automated first-comments'))).toBe(true);
  });
});