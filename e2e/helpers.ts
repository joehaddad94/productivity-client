/**
 * Shared helpers for Playwright tests.
 */
import { type Page, expect } from '@playwright/test';

export const API = 'http://localhost:8000';

/** Wait for the page to finish loading (no spinners). */
export async function waitForReady(page: Page) {
  // Use 'load' instead of 'networkidle' — polling queries (notifications etc.) prevent networkidle from ever resolving
  await page.waitForLoadState('load');
  // Dismiss any loading skeletons
  await page.waitForFunction(() => !document.querySelector('[data-testid="screen-loader"]'), {
    timeout: 15_000,
  }).catch(() => {});
  // Brief buffer for React Query initial fetches to complete
  await page.waitForTimeout(400);
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
