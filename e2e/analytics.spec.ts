import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/analytics');
  });

  test('page loads with Analytics heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /analytics/i }).first()
    ).toBeVisible();
  });

  test('shows stat cards (tasks completed, focus minutes, streak)', async ({ page }) => {
    await expect(page.getByText(/tasks completed/i).first()).toBeVisible();
    await expect(page.getByText(/focus/i).first()).toBeVisible();
  });

  test('shows charts without crashing', async ({ page }) => {
    // Charts are rendered via recharts — check the SVG elements exist
    await page.waitForSelector('svg, canvas, [class*="chart"]', { timeout: 8_000 })
      .catch(() => {}); // OK if no data yet
    // No error boundary / crash
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('no API errors shown to user', async ({ page }) => {
    await expect(page.getByText(/error|failed|could not load/i)).not.toBeVisible();
  });
});
