import { test, expect } from '@playwright/test';

test.describe('Orbitly Channels & Social Integrations Flow', () => {
  test('lists connected channels, filters by status, validates health, connects a live channel and manages settings', async ({
    page,
  }) => {
    // 1. Visit Channels page
    await page.goto('/en/channels');
    await expect(page).toHaveTitle(/Orbitly/i);

    // 2. Verify Header and Plan Limit badge
    await expect(page.getByRole('heading', { name: /Connected Channels/i })).toBeVisible();
    await expect(page.getByText(/channels used.*Pro plan/i)).toBeVisible();

    // 3. Verify Live Channel Cards
    await expect(page.getByText('sarah.bsky.social')).toBeVisible();
    await expect(page.getByText('sarah@mastodon.social')).toBeVisible();
    await expect(page.getByText('@orbitly_announcements')).toBeVisible();
    await expect(page.getByText('#marketing-announcements')).toBeVisible();

    // 4. Verify Status Badges
    await expect(page.locator('span.inline-flex', { hasText: /Active/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Needs Re-auth/i })).toBeVisible();

    // 5. Test Filter by Search
    const searchInput = page.getByPlaceholder(/Search by channel name/i);
    await searchInput.fill('bluesky');
    await expect(page.getByText('sarah.bsky.social')).toBeVisible();
    await expect(page.getByText('@orbitly_announcements')).not.toBeVisible();
    await searchInput.clear();

    // 6. Open "Connect Channel" modal
    const connectBtn = page.getByRole('button', { name: /Connect Channel/i }).first();
    await connectBtn.click();
    await expect(page.getByRole('heading', { name: /Connect Social Channel/i })).toBeVisible();

    // 7. Test Coming Soon / Notify Me toast
    const allTab = page.getByRole('button', { name: /All Platforms/i });
    await allTab.click();
    const twitterBtn = page.getByRole('button', { name: /X \(formerly Twitter\)/i });
    if (await twitterBtn.isVisible()) {
      await twitterBtn.click();
      await expect(page.getByText(/We'll notify you when/i)).toBeVisible();
    }

    // 8. Connect a live provider (Bluesky)
    const liveTab = page.getByRole('button', { name: /Live Integrations/i });
    await liveTab.click();
    const bskyBtn = page.getByRole('button', { name: /Bluesky/i });
    await bskyBtn.click();

    await expect(page.getByText(/Connect via AT Protocol App Password/i)).toBeVisible();
    await page.getByPlaceholder('yourhandle.bsky.social').fill('marketing.bsky.social');
    await page.getByPlaceholder('xxxx-xxxx-xxxx-xxxx').fill('abcd-efgh-ijkl-mnop');

    const submitConnectBtn = page.getByRole('button', { name: /Connect Bluesky Account/i });
    await submitConnectBtn.click();

    // 9. Verify channel added to grid
    await expect(page.getByText('@marketing.bsky.social', { exact: true })).toBeVisible();

    // 10. Open Settings for a channel
    const settingsBtn = page.getByTitle(/Settings/i).first();
    await settingsBtn.click();
    await expect(page.getByRole('heading', { name: /Channel Settings/i })).toBeVisible();

    const saveChangesBtn = page.getByRole('button', { name: /Save Changes/i });
    await saveChangesBtn.click();

    // 11. Test Disconnect confirmation dialog
    const deleteBtn = page.getByTitle(/Disconnect/i).first();
    await deleteBtn.click();
    await expect(page.getByText(/Are you sure you want to disconnect/i)).toBeVisible();

    const cancelBtn = page.getByRole('button', { name: /Cancel/i });
    await cancelBtn.click();
    await expect(page.getByText(/Are you sure you want to disconnect/i)).not.toBeVisible();
  });
});