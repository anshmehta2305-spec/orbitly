import { describe, it, expect } from 'vitest';
import { postWriterV1 } from '../prompts/post-writer.v1';
import { rewriteV1 } from '../prompts/rewrite.v1';
import { ideasV1 } from '../prompts/ideas.v1';
import { brandVoiceV1 } from '../prompts/brand-voice.v1';

describe('Versioned AI Prompt Templates', () => {
  it('renders post writer v1 with channels and brand voice traits', () => {
    const rendered = postWriterV1.render({
      topic: 'Launch announcement',
      channels: ['BLUESKY', 'LINKEDIN'],
      emojiLevel: 'low',
      brandVoice: { traits: ['Direct', 'Authoritative'] },
    });

    expect(rendered.system).toContain("Orbitly's expert social media copywriter");
    expect(rendered.user).toContain('Launch announcement');
    expect(rendered.user).toContain('BLUESKY');
    expect(rendered.user).toContain('Authoritative');
  });

  it('renders rewrite v1 for shorten mode', () => {
    const rendered = rewriteV1.render({
      content: 'Here is a very long post that needs trimming.',
      mode: 'shorten',
    });

    expect(rendered.user).toContain('shorten');
  });

  it('renders ideas v1 with 30-day plan', () => {
    const rendered = ideasV1.render({
      niche: 'SaaS Productivity',
      audience: 'Freelancers',
      goal: 'Engagement',
      isMonthlyPlan: true,
    });

    expect(rendered.user).toContain('30_day_calendar');
  });

  it('renders brand voice extractor with sample posts', () => {
    const rendered = brandVoiceV1.render({
      samplePosts: ['Ship fast and break nothing.', 'Simplicity wins every time.'],
    });

    expect(rendered.system).toContain('branding consultant');
    expect(rendered.user).toContain('Ship fast');
  });
});
