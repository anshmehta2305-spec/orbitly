import { test, expect } from '@playwright/test';

test.describe('AI Studio, Analytics & Automations E2E Flow', () => {
  test('AI Studio: Generates multi-channel variants, rewrites copy, and ideates campaign hooks', async ({
    page,
  }) => {
    // 1. Visit AI Studio
    await page.goto('/en/ai');
    await expect(page).toHaveTitle(/Orbitly/i);
    await expect(page.getByRole('heading', { name: /AI Studio/i })).toBeVisible();

    // 2. Verify Credit balance badge
    await expect(page.getByText(/Credits/i).first()).toBeVisible();

    // 3. Generate Post Variants
    const generateBtn = page.getByRole('button', { name: /Generate 3 Variations/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 4. Verify tailored output cards (Twitter, LinkedIn, Instagram)
    await expect(page.getByText(/Most creators waste 10\+ hours/i)).toBeVisible();

    // 5. Switch to Rewrite & Tone Tab
    const rewriteTab = page.getByRole('button', { name: /Rewrite & Tone/i });
    await rewriteTab.click();
    await expect(page.getByRole('heading', { name: /Original Content/i })).toBeVisible();

    // 6. Execute Rewrite action
    const rewriteBtn = page.getByRole('button', { name: /Rewrite Text/i });
    await rewriteBtn.click();

    // 7. Switch to Ideas Tab
    const ideasTab = page.getByRole('button', { name: /Ideas & Calendar/i });
    await ideasTab.click();
    await expect(page.getByRole('heading', { name: /Generate Content Ideas/i })).toBeVisible();
  });

  test('Analytics: Inspects KPI metrics, timeseries area chart, and 7x24 engagement heatmap', async ({
    page,
  }) => {
    // 1. Visit Analytics Page
    await page.goto('/en/analytics');
    await expect(page.getByRole('heading', { name: /Analytics & Performance/i })).toBeVisible();

    // 2. Verify 4 KPI cards
    await expect(page.getByText('Total Followers').first()).toBeVisible();
    await expect(page.getByText('Impressions').first()).toBeVisible();
    await expect(page.getByText('Engagements').first()).toBeVisible();
    await expect(page.getByText('Link Clicks').first()).toBeVisible();

    // 3. Verify 7x24 Heatmap section
    await expect(page.getByText(/Best Time to Post Intelligence/i)).toBeVisible();
    await expect(page.getByText(/Tuesday 09:00/i)).toBeVisible();

    // 4. Verify sortable posts table
    await expect(page.getByRole('heading', { name: /Post Performance & Metrics/i })).toBeVisible();
    await expect(page.getByText(/The biggest bottleneck for scaling modern brands/i)).toBeVisible();
  });

  test('Automations: Manages recurring schedules, triggers dry-run preview, and inspects inbound HMAC webhooks', async ({
    page,
  }) => {
    // 1. Visit Automations Page
    await page.goto('/en/automations');
    await expect(page.getByRole('heading', { name: /Automations & Workflows/i })).toBeVisible();

    // 2. Verify active automation rules
    await expect(page.getByText('Daily Morning Thought Leadership')).toBeVisible();
    await expect(page.getByText('Agency Blog Evergreen Recycling')).toBeVisible();

    // 3. Open Create Wizard
    const newAutoBtn = page.getByRole('button', { name: /New Automation/i });
    await newAutoBtn.click();
    await expect(page.getByText(/Choose Trigger Type/i)).toBeVisible();

    // Continue to Step 2
    const continueBtn = page.getByRole('button', { name: /Continue/i });
    await continueBtn.click();

    // Trigger Dry Run Preview
    const previewBtn = page.getByRole('button', { name: /Preview 3 Posts/i });
    await previewBtn.click();
    await expect(page.getByText(/Dry Run Preview: Next 3 Posts/i)).toBeVisible();

    // Close preview
    const closeBtn = page.getByRole('button', { name: /Close Preview/i });
    await closeBtn.click();

    // Close wizard
    const cancelBtn = page.getByRole('button', { name: /Back/i });
    await cancelBtn.click();
    const dismissBtn = page.getByRole('button', { name: /Cancel/i });
    await dismissBtn.click();

    // 4. Switch to Inbound Webhooks tab
    const webhooksTab = page.getByRole('button', { name: /Inbound Webhooks/i });
    await webhooksTab.click();
    await expect(page.getByText(/Inbound Webhook Triggers/i)).toBeVisible();
    await expect(page.getByText(/Signing Secret \(HMAC-SHA256\)/i)).toBeVisible();
  });
});
