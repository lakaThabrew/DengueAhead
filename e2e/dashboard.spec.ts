import { test, expect } from '@playwright/test';

test.describe('Phase 5 Dashboard E2E Flows', () => {
  // ── Flow 1: Landing to Map & Area Detail ────────────────────────────────────
  test('Flow 1: Landing to Map to District Detail navigation', async ({ page }) => {
    await page.goto('/');

    // Expect headline & non-clinical disclaimer
    await expect(page.locator('h1')).toContainText('Early Warning');
    await expect(page.getByText(/Non-clinical decision-support/i)).toBeVisible();

    // Click Explore Risk Map
    await page.getByRole('button', { name: /Explore Risk Map/i }).click();
    await expect(page).toHaveURL(/.*\/app\/map/);
    await expect(page.locator('h1')).toContainText('District Risk Map');

    // Click on detail button for first district
    const detailBtn = page.getByRole('button', { name: /Detail →/i }).first();
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();

    await expect(page).toHaveURL(/.*\/app\/areas\/.*/);
    await expect(page.locator('h1')).toContainText('District');
  });

  // ── Flow 2: Comparison Selection ──────────────────────────────────────────
  test('Flow 2: Comparison selection and side-by-side display', async ({ page }) => {
    await page.goto('/app/compare?areaIds=LK-11,LK-12');
    await expect(page.locator('h1')).toContainText('Multi-District Comparison');
    await expect(page.getByText(/Selected Districts/i)).toBeVisible();
  });

  // ── Flow 3: Historical Time Travel ────────────────────────────────────────
  test('Flow 3: Historical Replay unmasks actual outcome on reveal', async ({ page }) => {
    await page.goto('/app/history');
    await expect(page.locator('h1')).toContainText('Historical Replay');

    // Initially outcome should be hidden
    await expect(page.getByText(/Hidden/i)).toBeVisible();

    // Click Reveal Actual Outcome
    await page.getByRole('button', { name: /Reveal Actual Outcome/i }).click();

    // Outcome should now be unmasked
    await expect(page.getByText(/Reported Actual Outcome/i)).toBeVisible();
    await expect(page.getByText(/Error Delta vs Historical Baselines/i)).toBeVisible();
  });

  // ── Flow 4: Responsiveness & Viewports ────────────────────────────────────
  test('Flow 4: Responsiveness across mobile, tablet, and desktop viewports', async ({ page }) => {
    const viewports = [
      { width: 360, height: 640 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/app/overview');

      // Check horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 1-2px tolerance
    }
  });

  // ── Flow 5: Methodology & Non-clinical Disclaimers ────────────────────────
  test('Flow 5: Public Methodology renders target formulations and disclaimers', async ({
    page
  }) => {
    await page.goto('/methodology');
    await expect(page.locator('h1')).toContainText('Methodology');
    await expect(page.getByText(/Non-Clinical Decision-Support Scope/i)).toBeVisible();
    await expect(page.getByText(/Target Formulation/i)).toBeVisible();
  });
});
