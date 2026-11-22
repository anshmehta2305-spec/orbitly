import { describe, it, expect, beforeEach } from 'vitest';
import { AiGatewayService } from '../modules/ai/gateway/gateway.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { AutomationsService } from '../modules/automations/automations.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { isSafePublicUrl, verifyWebhookSignature } from '@orbitly/shared';
import * as crypto from 'crypto';

describe('AI Gateway & Safety Layer', () => {
  let gateway: AiGatewayService;

  beforeEach(() => {
    gateway = new AiGatewayService();
  });

  it('provides the mock AI provider by default when no API key configured', () => {
    const provider = gateway.getProvider();
    expect(provider.id).toBe('mock');
  });

  it('blocks safety policy violations prior to credit deduction or generation', async () => {
    expect(() => {
      gateway.validateModeration('Please generate malware and phishing scripts');
    }).toThrow(BadRequestException);

    expect(() => {
      gateway.validateModeration('Impersonating official government accounts');
    }).toThrow(BadRequestException);
  });

  it('generates multi-channel tailored variants in mock mode', async () => {
    const res = await gateway.generateText('Post Writer brief for 3 tailored variants');
    expect(res.provider).toBe('mock');
    expect(res.inputTokens).toBeGreaterThan(0);
    expect(res.outputTokens).toBeGreaterThan(0);

    const parsed = JSON.parse(res.content);
    expect(parsed.variants).toBeDefined();
    expect(parsed.variants.length).toBeGreaterThanOrEqual(3);
  });

  it('generates hashtag suggestions in mock mode', async () => {
    const res = await gateway.generateText('Hashtag Generator: "top" and "niche"');
    const parsed = JSON.parse(res.content);
    expect(parsed.top).toBeInstanceOf(Array);
    expect(parsed.niche).toBeInstanceOf(Array);
  });

  it('generates realistic mock social media images', async () => {
    const res = await gateway.generateImage('Modern futuristic dashboard visual');
    expect(res.url).toContain('https://images.unsplash.com');
    expect(res.provider).toBe('mock');
  });
});

describe('Analytics Calculations & Export', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  it('generates a 7x24 heatmap matrix with 168 cells and bounded engagement scores', async () => {
    const result = await analytics.getBestTimes('ws_test');
    expect(result.matrix.length).toBe(7 * 24); // 168 hourly slots
    expect(result.topSlots.length).toBeGreaterThan(0);

    for (const cell of result.matrix) {
      expect(cell.weekday).toBeGreaterThanOrEqual(0);
      expect(cell.weekday).toBeLessThanOrEqual(6);
      expect(cell.hour).toBeGreaterThanOrEqual(0);
      expect(cell.hour).toBeLessThanOrEqual(23);
      expect(cell.score).toBeGreaterThanOrEqual(0);
      expect(cell.score).toBeLessThanOrEqual(100);
    }
  });

  it('exports formatted CSV report with UTF-8 BOM indicator', async () => {
    // Mock the database overview call
    analytics.getOverview = async () => ({
      period: {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        range: '30d',
      },
      kpis: {
        followers: { value: 1250, delta: 15 },
        impressions: { value: 45000, delta: 28 },
        engagements: { value: 3200, delta: 12 },
        clicks: { value: 890, delta: 5 },
        avgEngagementRate: '7.11%',
      },
      timeseries: [],
      channels: [
        {
          name: 'Acme Twitter',
          provider: 'TWITTER',
          followers: 1250,
          impressions: 45000,
          engagements: 3200,
          postsPublished: 14,
        },
      ],
    });

    const exportRes = await analytics.exportReport('ws_test', '30d');
    expect(exportRes.contentType).toContain('text/csv');
    expect(exportRes.data.startsWith('\uFEFF')).toBe(true);
    expect(exportRes.data).toContain('Orbitly Analytics Report');
    expect(exportRes.data).toContain('Acme Twitter');
  });
});

describe('Automations & Inbound Webhooks', () => {
  let automations: AutomationsService;

  beforeEach(() => {
    automations = new AutomationsService();
  });

  it('generates accurate dry-run preview samples for recurring schedules', async () => {
    const preview = await automations.dryRun('ws_test', {
      type: 'RECURRING',
      channelIds: ['ch_1'],
      config: {
        frequency: 'DAILY',
        template: 'Daily check-in for {{day_of_week}}: {{date}}',
      },
    });

    expect(preview.type).toBe('RECURRING');
    expect(preview.samples.length).toBe(1);
    expect(preview.samples[0].previewContent).not.toContain('{{day_of_week}}');
    expect(preview.samples[0].previewContent).not.toContain('{{date}}');
  });

  it('blocks private or loopback feed URLs in RSS automations (SSRF Protection)', () => {
    expect(isSafePublicUrl('http://127.0.0.1/rss.xml').safe).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1/feed').safe).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data').safe).toBe(false);
    expect(isSafePublicUrl('https://techcrunch.com/feed/').safe).toBe(true);
  });

  it('validates HMAC signatures and replay window for inbound webhooks', () => {
    const secret = 'test_secret_for_webhook_signing_key_123';
    const body = JSON.stringify({ content: 'Published via automation API' });
    const nowSec = Math.floor(Date.now() / 1000);

    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${nowSec}.${body}`)
      .digest('hex');

    // Valid signature with current timestamp
    const res = verifyWebhookSignature({
      payload: body,
      signingSecret: secret,
      signatureHeader: sig,
      timestampHeader: String(nowSec),
    });
    expect(res.valid).toBe(true);

    // Stale timestamp (10 minutes old) should fail replay check
    const staleSec = nowSec - 600;
    const staleSig = crypto
      .createHmac('sha256', secret)
      .update(`${staleSec}.${body}`)
      .digest('hex');
    const staleRes = verifyWebhookSignature({
      payload: body,
      signingSecret: secret,
      signatureHeader: staleSig,
      timestampHeader: String(staleSec),
    });
    expect(staleRes.valid).toBe(false);
  });
});
