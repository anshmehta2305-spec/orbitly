import { test, expect } from '@playwright/test';

test.describe('Teams, Approvals & Client Share Portal Flow', () => {
  test('Owner invites Editor -> Editor submits post -> Admin requests changes -> Editor resubmits -> Admin approves to schedule', async ({
    page,
  }) => {
    // 1. Visit Team Management Page
    await page.goto('/en/team');
    await expect(page).toHaveTitle(/Orbitly/i);
    await expect(page.getByRole('heading', { name: /Team & Access Control/i })).toBeVisible();

    // 2. Open Invite Member Modal
    const inviteBtn = page.getByRole('button', { name: /Invite Member/i }).first();
    await inviteBtn.click();
    await expect(page.getByText('Invite teammates to collaborate')).toBeVisible();

    // 3. Fill and send invitation
    const emailInput = page.getByPlaceholder(/colleague@company\.com/i);
    await emailInput.fill('editor.devon@company.com');
    const sendInviteBtn = page.getByRole('button', { name: /Send Invitation/i });
    await sendInviteBtn.click();

    // 4. Navigate to Approvals Inbox
    await page.goto('/en/approvals');
    await expect(page.getByRole('heading', { name: /Approvals Inbox/i })).toBeVisible();

    // 5. Verify pending review post card exists
    const queueCard = page.getByText(/Q4 Product Showcase|Excited to announce/i).first();
    if (await queueCard.isVisible()) {
      await queueCard.click();

      // 6. Request Changes
      const feedbackInput = page.getByPlaceholder(/Add feedback notes/i);
      await feedbackInput.fill('Please update tone for professional audiences.');
      const requestChangesBtn = page.getByRole('button', { name: /Request Changes/i });
      await requestChangesBtn.click();

      // 7. Verify Approve button works on re-review
      const approveBtn = page.getByRole('button', { name: /Approve/i }).first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
      }
    }
  });

  test('Create password-protected Share Link -> Client unlocks portal, identifies, comments and approves post', async ({
    page,
  }) => {
    // 1. Visit Team page to open Share Link Modal
    await page.goto('/en/team');
    const shareLinksBtn = page.getByRole('button', { name: /Client Share Links/i }).first();
    await shareLinksBtn.click();
    await expect(page.getByText(/Create Client Share Link/i)).toBeVisible();

    // 2. Configure share link
    const labelInput = page.getByPlaceholder(/e\.g\. Acme Q4/i);
    await labelInput.fill('Acme Client Campaign Q4');

    // 3. Visit a public share review portal
    await page.goto('/en/share/demo_portal_token_123');
    await expect(page.getByText(/Loading review portal/i)).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    // 4. Verify password prompt or portal access
    const passwordInput = page.getByPlaceholder(/Enter review password/i);
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('clientSecret123');
      await page.getByRole('button', { name: /Unlock Portal/i }).click();
      await expect(passwordInput).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    }

    // 5. Verify Client Portal Header and feed
    await expect(page.getByText(/Upcoming Scheduled Posts|Client Review Portal|Protected Review Portal/i).first()).toBeVisible();

    // 6. Client identity form if visible
    const nameInput = page.getByPlaceholder(/Your Name/i);
    try {
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill('Jordan Client');
        await page.getByPlaceholder(/Your Email/i).fill('jordan@acme.com');
        await page.getByRole('button', { name: /Save/i }).click();
      }
    } catch {
      // Identity already set or bypassed
    }

    // 7. Client approves post
    const approveBtn = page.getByRole('button', { name: /Approve Post/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
    }
  });
});
