import { test, expect } from '@playwright/test';

test.describe('Phase 0 shell smoke tests', () => {
  test('landing page renders DengueAhead heading and non-clinical banner', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('System Foundation');
    await expect(page.getByText(/Non-clinical decision-support system/i)).toBeVisible();
  });

  test('skip link is present for keyboard navigation', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeAttached();
  });

  test('API health badge eventually shows a non-loading state', async ({ page }) => {
    await page.goto('/');
    // The badge should resolve from "Checking…" to one of the known states
    await expect(page.getByRole('status')).not.toContainText('Checking…', { timeout: 10_000 });
  });

  test('API /health endpoint returns 200 with correct shape', async ({ request }) => {
    const res = await request.get('http://localhost:4000/api/v1/health');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['status']).toBe('ok');
    expect(body['apiVersion']).toBeDefined();
    expect(body['service']).toBe('dengueahead-api');
    expect(res.headers()['x-request-id']).toBeDefined();
  });

  test('API /readiness endpoint is accessible', async ({ request }) => {
    // With no real Mongo in the default smoke environment, may return 200 or 503
    // but must never be 500 or crash
    const res = await request.get('http://localhost:4000/api/v1/readiness');
    expect([200, 503]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['status']).toBeDefined();
    expect(body['components']).toBeDefined();
  });

  test('unknown route returns structured 404', async ({ request }) => {
    const res = await request.get('http://localhost:4000/api/v1/does-not-exist');
    expect(res.status()).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    const error = body['error'] as Record<string, unknown>;
    expect(error['code']).toBe('NOT_FOUND');
    expect(error['requestId']).toBeDefined();
  });

  test('POST to read-only API returns 405', async ({ request }) => {
    const res = await request.post('http://localhost:4000/api/v1/health', { data: {} });
    expect(res.status()).toBe(405);
  });

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(consoleErrors).toHaveLength(0);
  });
});
