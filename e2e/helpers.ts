/**
 * Shared helpers for Playwright tests.
 */
import { type Page, expect } from '@playwright/test';
import { API } from "./env";

export { API };
export { PLAYWRIGHT_BASE_URL } from "./env";

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
  //
  // Exclude [data-live-indicator]: the Pomodoro widget pulses a dot while the
  // timer RUNS, which is not a loading state and never goes away. Counting it
  // meant that once any test started the timer, every later goto() in the run
  // burned this full 15 s budget — which is what pushed the Pomodoro
  // beforeEach past its 60 s limit and failed four tests that were fine.
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.animate-pulse:not([data-live-indicator])')
        .length === 0,
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

/** Select all — ⌘A on macOS, Ctrl+A on Windows/Linux (contenteditable / inputs). */
export async function selectAll(page: Page) {
  await page.keyboard.press("ControlOrMeta+a");
}
