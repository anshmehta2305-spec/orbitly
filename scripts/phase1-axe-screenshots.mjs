import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROUTES = [
  // Marketing
  { name: 'home', path: '/en' },
  { name: 'features', path: '/en/features' },
  { name: 'pricing', path: '/en/pricing' },
  { name: 'integrations', path: '/en/integrations' },
  { name: 'blog', path: '/en/blog' },
  { name: 'about', path: '/en/about' },
  { name: 'contact', path: '/en/contact' },
  { name: 'changelog', path: '/en/changelog' },
  { name: 'docs', path: '/en/docs' },
  { name: 'terms', path: '/en/terms' },
  { name: 'privacy', path: '/en/privacy' },
  { name: 'cookies', path: '/en/cookies' },
  { name: 'design-system', path: '/en/design-system' },
  { name: 'not-found', path: '/en/non-existent-page-404' },

  // Auth
  { name: 'auth-login', path: '/en/login' },
  { name: 'auth-signup', path: '/en/signup' },
  { name: 'auth-forgot-password', path: '/en/forgot-password' },
  { name: 'auth-reset-password', path: '/en/reset-password' },
  { name: 'auth-verify-email', path: '/en/verify-email' },
  { name: 'auth-magic-link', path: '/en/magic-link' },
  { name: 'auth-2fa', path: '/en/2fa' },
  { name: 'auth-onboarding', path: '/en/onboarding' },

  // App
  { name: 'app-dashboard', path: '/en/dashboard' },
  { name: 'app-calendar', path: '/en/calendar' },
  { name: 'app-channels', path: '/en/channels' },
  { name: 'app-analytics', path: '/en/analytics' },
  { name: 'app-ai', path: '/en/ai' },
  { name: 'app-approvals', path: '/en/approvals' },
  { name: 'app-automations', path: '/en/automations' },
  { name: 'app-team', path: '/en/team' },
  { name: 'app-settings-workspace', path: '/en/settings/workspace' },
  { name: 'app-settings-billing', path: '/en/settings/billing' },
  { name: 'app-settings-developers', path: '/en/settings/developers' },
  { name: 'app-settings-security', path: '/en/settings/security' },

  // Admin
  { name: 'admin-overview', path: '/en/admin' },
  { name: 'admin-users', path: '/en/admin/users' },
  { name: 'admin-workspaces', path: '/en/admin/workspaces' },
  { name: 'admin-subscriptions', path: '/en/admin/subscriptions' },
  { name: 'admin-queues', path: '/en/admin/queues' },
  { name: 'admin-providers', path: '/en/admin/providers' },
  { name: 'admin-flags', path: '/en/admin/flags' },
  { name: 'admin-funnel', path: '/en/admin/funnel' },
  { name: 'admin-audit', path: '/en/admin/audit' },
  { name: 'admin-announcements', path: '/en/admin/announcements' },

  // Public / Share
  { name: 'public-share', path: '/en/share/demo-token' },
  { name: 'public-unsubscribe', path: '/en/unsubscribe' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const THEMES = ['light', 'dark'];

async function runAudit() {
  console.log('--- Starting Axe & Playwright Baseline Audit ---');
  const browser = await chromium.launch();
  const contrastViolations = {};
  const detailedViolations = [];

  const screenshotDir = path.join(process.cwd(), 'screenshots', 'before');
  fs.mkdirSync(screenshotDir, { recursive: true });

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const vpThemeDir = path.join(screenshotDir, theme, vp.name);
      fs.mkdirSync(vpThemeDir, { recursive: true });

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      const page = await context.newPage();

      for (const route of ROUTES) {
        const fullUrl = `${BASE_URL}${route.path}`;
        const routeKey = `${route.name} (${theme}, ${vp.name})`;
        contrastViolations[routeKey] = 0;

        try {
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          // Ensure theme class is applied on <html>
          await page.evaluate((t) => {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(t);
            document.documentElement.setAttribute('data-theme', t);
          }, theme);
          await page.waitForTimeout(400);

          // Capture screenshot
          const screenshotPath = path.join(vpThemeDir, `${route.name}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          // Run Axe color contrast audit on desktop only for speed, or both
          if (vp.name === 'desktop') {
            try {
              const axeResults = await new AxeBuilder({ page })
                .withRules(['color-contrast'])
                .analyze();

              const violations = axeResults.violations.find((v) => v.id === 'color-contrast');
              const nodeCount = violations ? violations.nodes.length : 0;
              contrastViolations[`${route.name} (${theme})`] = nodeCount;

              if (nodeCount > 0) {
                violations.nodes.forEach((node) => {
                  detailedViolations.push({
                    route: route.name,
                    path: route.path,
                    theme,
                    target: node.target.join(' > '),
                    html: node.html.substring(0, 150),
                    summary: node.failureSummary,
                  });
                });
              }
            } catch (err) {
              console.warn(`Axe failed on ${route.name}:`, err.message);
            }
          }
        } catch (err) {
          console.warn(`Could not load ${route.name}: ${err.message}`);
        }
      }
      await context.close();
    }
  }

  await browser.close();

  // Aggregate stats
  let totalContrastViolations = 0;
  const pageContrastTable = [];

  for (const [key, count] of Object.entries(contrastViolations)) {
    if (key.includes('(light)') || key.includes('(dark)')) {
      totalContrastViolations += count;
      pageContrastTable.push({ pageTheme: key, violations: count });
    }
  }

  pageContrastTable.sort((a, b) => b.violations - a.violations);
  const worst10 = pageContrastTable.slice(0, 10);

  const report = {
    totalContrastViolations,
    worst10,
    pageContrastTable,
    detailedViolations,
  };

  fs.writeFileSync('audit-contrast-results.json', JSON.stringify(report, null, 2));
  console.log(`\nAudit Complete! Total Contrast Violations: ${totalContrastViolations}`);
  console.log('\n--- Worst 10 Pages by Contrast Violations ---');
  console.table(worst10);

  return report;
}

runAudit().catch(console.error);
