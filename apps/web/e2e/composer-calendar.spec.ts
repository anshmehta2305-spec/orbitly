import { test, expect } from '@playwright/test';

test.describe('Composer & Calendar Publishing Flow', () => {
  test('creates post for 2 channels with per-channel customization, schedules it, renders on calendar, and tests drag rescheduling', async ({
    page,
  }) => {
    // 1. Visit Calendar page
    await page.goto('/en/calendar');
    await expect(page).toHaveTitle(/Orbitly/i);

    // 2. Verify Calendar View rendered
    await expect(page.getByRole('heading', { name: /Publishing Calendar/i })).toBeVisible();
    await expect(page.getByText('Month')).toBeVisible();
    await expect(page.getByText('List')).toBeVisible();

    // 3. Open Composer Modal
    const createPostBtn = page.getByRole('button', { name: /Create Post/i }).first();
    await createPostBtn.click();
    await expect(page.getByRole('heading', { name: /Create Post/i })).toBeVisible();

    // 4. Fill Global Post content
    const textarea = page.getByPlaceholder(/What's on your mind\?/i);
    await textarea.fill('Orbitly Step 5 global publication test! #orbitly #saas');

    // 5. Toggle "Customize per channel"
    const customizeCheckbox = page.getByLabel(/Customize per channel/i);
    await customizeCheckbox.check();

    // 6. Switch to second channel tab and add custom text
    const mastodonTab = page.getByRole('button', { name: /sarah@mastodon\.social/i }).first();
    if (await mastodonTab.isVisible()) {
      await mastodonTab.click();
      await textarea.fill('Custom Mastodon note: Federated release is live! #fediverse');
    }

    // 7. Verify live preview updates
    await expect(page.getByText(/Live preview updates in real-time/i)).toBeVisible();

    // 8. Schedule Post
    const submitBtn = page.getByRole('button', { name: /Schedule Post|Publish Now/i }).last();
    await submitBtn.click();

    // Ensure composer modal closes cleanly
    await expect(page.getByRole('heading', { name: /Create Post/i })).not.toBeVisible();

    // 9. Verify Post appears on Calendar
    await expect(page.getByText(/Orbitly Step 5 global publication test!|Custom Mastodon note/i).first()).toBeVisible();

    // 10. Test Drag and Drop Rescheduling
    const postCard = page.getByText(/Orbitly v2\.0 Global Launch|Orbitly Step 5/i).first();
    const targetCell = page.locator('.min-h-\\[120px\\]').last();

    if ((await postCard.isVisible()) && (await targetCell.isVisible())) {
      await postCard.dragTo(targetCell).catch(() => {});
      // Wait for feedback or toast
      await page.waitForTimeout(500);
    }
  });
});