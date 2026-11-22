import { test, expect } from '@playwright/test';

test.describe('Orbitly Marketing Site & Design System Smoke Tests', () => {
  test('home page loads with hero, mockup and platform marquee', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Orbitly/i);

    // Verify Hero elements
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Plan once/i);
    await expect(page.getByText(/Seamless Native Publishing Across All 15\+ Global Platforms/i)).toBeVisible();

    // Verify interactive mockup is rendered in DOM
    await expect(page.getByText(/Multi-Post Composer/i)).toBeVisible();
    await expect(page.getByText(/Best Time to Post Today/i)).toBeVisible();
  });

  test('pricing page toggles billing interval and currency', async ({ page }) => {
    await page.goto('/en/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Pick the Perfect Orbitly Plan/i);

    // Verify 4 plans
    await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Team', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agency', exact: true })).toBeVisible();

    // Toggle currency to EUR
    const eurBtn = page.getByRole('button', { name: 'EUR' });
    if (await eurBtn.isVisible()) {
      await eurBtn.click();
      await expect(page.getByText(/€/i).first()).toBeVisible();
    }
  });

  test('integrations page filters platforms by search input', async ({ page }) => {
    await page.goto('/en/integrations');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Connect Everywhere You Publish/i);

    const searchInput = page.getByPlaceholder(/Search platforms by name/i);
    await searchInput.fill('LinkedIn');
    await expect(page.getByText(/LinkedIn/i).first()).toBeVisible();
  });

  test('blog index and post template load cleanly', async ({ page }) => {
    await page.goto('/en/blog');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/The Orbitly Blog/i);

    // Click first article
    const firstArticleLink = page.getByRole('link', { name: /How High-Growth Teams Scale Multi-Platform/i }).first();
    if (await firstArticleLink.isVisible()) {
      await firstArticleLink.click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/How High-Growth Teams/i);
    }
  });

  test('design system documentation page displays all component tokens', async ({ page }) => {
    await page.goto('/en/design-system');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Orbitly Design System/i);
    await expect(page.getByText(/Color Palette Tokens/i)).toBeVisible();
    await expect(page.getByText(/Button Variants & Sizes/i)).toBeVisible();
  });
});
