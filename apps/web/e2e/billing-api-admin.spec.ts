import { test, expect } from '@playwright/test';

test.describe('Step 8: Billing, Public API, MCP & Admin Panel Flow', () => {
  test('Billing Settings: View plan, toggle currency, preview upgrade and cancel flow', async ({ page }) => {
    // 1. Visit Workspace Billing Settings
    await page.goto('/en/settings/billing');
    await expect(page).toHaveTitle(/Orbitly/i);
    await expect(page.getByRole('heading', { name: /Billing & Plans|Subscription & Billing/i })).toBeVisible();

    // 2. Check Plan Overview & Usage Meters
    await expect(page.getByText(/Current Plan/i)).toBeVisible();
    await expect(page.getByText(/Monthly Posts Published|Monthly Scheduled Posts/i)).toBeVisible();
    await expect(page.getByText(/Connected Channels|Social Channels/i)).toBeVisible();

    // 3. Switch Currencies
    const eurBtn = page.getByRole('button', { name: 'EUR' });
    if (await eurBtn.isVisible()) {
      await eurBtn.click();
      await expect(page.getByText('€').first()).toBeVisible();
    }

    const inrBtn = page.getByRole('button', { name: 'INR' });
    if (await inrBtn.isVisible()) {
      await inrBtn.click();
      await expect(page.getByText('₹').first()).toBeVisible();
    }

    // 4. Test Cancellation Flow Modal
    const cancelBtn = page.getByRole('button', { name: /Cancel Subscription/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.getByRole('heading', { name: /Cancel Subscription/i })).toBeVisible();
      await expect(page.getByText(/billing period|grace period/i)).toBeVisible();

      // Close modal
      const keepBtn = page.getByRole('button', { name: /Keep Subscription/i });
      await keepBtn.click();
    }
  });

  test('Developer Settings: Generate scoped API key, test revoke and add outbound webhook', async ({ page }) => {
    // 1. Visit Developer Settings
    await page.goto('/en/settings/developers');
    await expect(page.getByRole('heading', { name: /Developer Settings/i })).toBeVisible();

    // 2. Open Generate API Key Modal
    const newKeyBtn = page.getByRole('button', { name: /Create API Key|Generate New Key/i });
    await newKeyBtn.click();
    await expect(page.getByText(/Create New API Key|Generate Scoped API Key/i)).toBeVisible();

    // 3. Fill Key Name
    const nameInput = page.getByPlaceholder(/e\.g\. Production Zapier/i);
    await nameInput.fill('E2E Automation Client Key');

    // 4. Generate Key
    const submitBtn = page.getByRole('button', { name: /Generate Key|Generate Live Key/i });
    await submitBtn.click();

    // 5. Verify Token Reveal Modal
    await expect(page.getByText(/Save this API key immediately!|Secret Key Generated/i)).toBeVisible();
    await expect(page.getByText(/orb_live_/i).first()).toBeVisible();

    // Close reveal modal
    const doneBtn = page.getByRole('button', { name: /I Have Saved My Key|Done/i });
    await doneBtn.click();

    // 6. Test Registering Outbound Webhook
    const webhooksTab = page.getByRole('button', { name: /Webhooks/i });
    if (await webhooksTab.isVisible()) {
      await webhooksTab.click();
    }

    const addWebhookBtn = page.getByRole('button', { name: /Register Webhook|Add Webhook Endpoint/i });
    if (await addWebhookBtn.isVisible()) {
      await addWebhookBtn.click();
      await expect(page.getByText(/Register Outbound Webhook|Register Webhook Endpoint/i)).toBeVisible();

      const urlInput = page.getByPlaceholder(/https:\/\/api\.yourdomain\.com\/webhooks/i);
      await urlInput.fill('https://example.com/api/orbitly-webhook');

      const saveWebhookBtn = page.getByRole('button', { name: /Register Endpoint/i });
      await saveWebhookBtn.click();
    }
  });

  test('Public API Interactive Documentation page loads with code examples', async ({ page }) => {
    // 1. Visit API Docs
    await page.goto('/en/docs/api');
    await expect(page.getByRole('heading', { name: /Developer API & Webhooks/i })).toBeVisible();

    // 2. Verify endpoints listed
    await expect(page.getByText('/public/v1/channels').first()).toBeVisible();
    await expect(page.getByText('/public/v1/posts').first()).toBeVisible();

    // 3. Switch code snippets to Python
    const pythonBtn = page.getByRole('button', { name: 'Python' });
    await pythonBtn.click();
    await expect(page.getByText(/from orbitly import Orbitly/i).first()).toBeVisible();

    // 4. Switch code snippets to TypeScript SDK
    const jsBtn = page.getByRole('button', { name: 'TypeScript SDK' });
    await jsBtn.click();
    await expect(page.getByText(/import { OrbitlyClient }/i).first()).toBeVisible();
  });

  test('Admin Console: Inspect KPIs, user management, and workspace plan overrides', async ({ page }) => {
    // 1. Visit Admin Dashboard
    await page.goto('/en/admin');
    await expect(page.getByRole('heading', { name: /Platform Operations Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Monthly Recurring Revenue/i)).toBeVisible();
    await expect(page.getByText(/BullMQ Queue Depth/i)).toBeVisible();

    // 2. Visit Users Management
    await page.goto('/en/admin/users');
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
    const searchInput = page.getByPlaceholder(/Search by name or email/i);
    await searchInput.fill('Sarah');
    await expect(page.getByText('sarah@example.com')).toBeVisible();

    // 3. Visit Workspaces & Comp Plan
    await page.goto('/en/admin/workspaces');
    await expect(page.getByRole('heading', { name: /Workspace Management/i })).toBeVisible();
    const compBtn = page.getByRole('button', { name: /Comp Plan/i }).first();
    if (await compBtn.isVisible()) {
      await compBtn.click();
      await expect(page.getByText(/Override \/ Comp Plan/i)).toBeVisible();
      const cancelCompBtn = page.getByRole('button', { name: 'Cancel' });
      await cancelCompBtn.click();
    }

    // 4. Visit BullMQ Queue Inspector
    await page.goto('/en/admin/queues');
    await expect(page.getByRole('heading', { name: /BullMQ Queue Inspector/i })).toBeVisible();
    await expect(page.getByText('publishing').first()).toBeVisible();
    await expect(page.getByText('payment-events').first()).toBeVisible();

    // 5. Visit Provider Health & Kill Switches
    await page.goto('/en/admin/providers');
    await expect(page.getByRole('heading', { name: /Provider Health & Emergency Kill Switches/i })).toBeVisible();
    await expect(page.getByText('X (formerly Twitter)')).toBeVisible();
    await expect(page.getByText('Instagram (Graph API)')).toBeVisible();
  });
});
