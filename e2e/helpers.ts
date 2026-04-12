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
  // Wait for the tasks loading skeleton (4 animate-pulse rows) to disappear.
  // With 200+ tasks in the workspace the initial API response can take >400 ms.
  await page.waitForFunction(
    () => document.querySelectorAll('.animate-pulse').length === 0,
    { timeout: 15_000 },
  ).catch(() => {});
  // Small buffer for React to commit the new state
  await page.waitForTimeout(200);
}

/** Navigate to a route and wait for it to settle. */
export async function goto(page: Page, path: string) {
  await page.goto(path);
  await waitForReady(page);
}

/** Assert a toast notification appears with the given text. */
export async function expectToast(page: Page, text: string | RegExp) {
  // 10 s — the local API can be slow when the workspace has many tasks queued for invalidation
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: text }))
    .toBeVisible({ timeout: 10_000 });
}
