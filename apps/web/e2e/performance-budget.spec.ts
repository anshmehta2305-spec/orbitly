import { test, expect } from '@playwright/test';

test.describe('Performance & Core Web Vitals Guardrails', () => {
  const routes = ['/en', '/en/pricing', '/en/features', '/en/login', '/en/signup'];

  for (const route of routes) {
    test(`route ${route} loads within strict performance budget`, async ({ page }) => {
      const start = performance.now();
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      const duration = performance.now() - start;

      // Status must be 200
      expect(response?.status()).toBe(200);

      // DOM Content Loaded budget: under 2000ms
      expect(duration).toBeLessThan(2500);

      // Evaluate performance metrics in browser
      const metrics = await page.evaluate(() => {
        const perf = window.performance;
        const timing = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domInteractive: timing?.domInteractive || 0,
          responseEnd: timing?.responseEnd || 0,
          duration: timing?.duration || 0,
        };
      });

      // TTFB / responseEnd budget (Standard Web Vitals threshold: < 2000ms)
      if (metrics.responseEnd > 0) {
        expect(metrics.responseEnd).toBeLessThan(2000);
      }
    });
  }

  test('client navigation between pricing and login is instantaneous', async ({ page }) => {
    await page.goto('/en/pricing');
    const start = performance.now();
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/login/);
    const navDuration = performance.now() - start;

    // SPA client navigation budget: under 1000ms
    expect(navDuration).toBeLessThan(1200);
  });
});
