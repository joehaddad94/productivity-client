/**
 * Shared helpers for Playwright tests.
 */
import { type Page, expect } from '@playwright/test';

export const API = 'http://localhost:8000';

/** Wait for the page to finish loading (no spinners). */
export async function waitForReady(page: Page) {
  await page.waitForLoadState('networkidle');
  // Dismiss any loading skeletons
  await page.waitForFunction(() => !document.querySelector('[data-testid="screen-loader"]'), {
    timeout: 10_000,
  }).catch(() => {});
}

/** Navigate to a route and wait for it to settle. */
export async function goto(page: Page, path: string) {
  await page.goto(path);
  await waitForReady(page);
}

/** Assert a toast notification appears with the given text. */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: text }))
    .toBeVisible({ timeout: 5_000 });
}
