import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Pomodoro — redesign + task linking', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/dashboard');
    // Wait for the widget pill to be visible
    await expect(
      page.getByRole('button', { name: /toggle pomodoro timer/i })
    ).toBeVisible({ timeout: 8_000 });
  });

  // --- Collapsed pill ---
  test('collapsed pill shows timer in MM:SS format', async ({ page }) => {
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible();
  });

  test('collapsed pill shows 25:00 on fresh load', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible();
  });

  test('pill has gradient styling (not plain white)', async ({ page }) => {
    const pill = page.getByRole('button', { name: /toggle pomodoro timer/i });
    const cls = await pill.getAttribute('class');
    // Should have gradient classes from the redesign
    expect(cls).toMatch(/gradient/);
  });

  // --- Expanded panel ---
  test('clicking pill expands the panel', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    // The gradient header label is only visible when expanded
    await expect(page.getByText('Focus').first()).toBeVisible();
  });

  test('expanded panel shows session dots', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    // 4 session dots rendered as small divs
    const dots = page.locator('.rounded-full.bg-white\\/30, .rounded-full.bg-white').filter({ hasNot: page.locator('svg') });
    expect(await dots.count()).toBeGreaterThanOrEqual(4);
  });

  // --- Timer controls ---
  test('start button starts the timer', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('25:00')).not.toBeVisible({ timeout: 3_000 });
  });

  test('pause button stops the timer', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: /pause/i }).first().click();
    const t1 = await page.getByText(/\d{2}:\d{2}/).first().textContent();
    await page.waitForTimeout(1500);
    const t2 = await page.getByText(/\d{2}:\d{2}/).first().textContent();
    expect(t1).toBe(t2);
  });

  test('reset button returns to 25:00', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /reset/i }).first().click();
    await expect(page.getByText('25:00').first()).toBeVisible({ timeout: 3_000 });
  });

  // --- Task linking ---
  test('task link section is visible when expanded', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    // "Focus on a task…" or "No tasks available" should be visible
    const linkArea = page.getByText(/focus on a task|no tasks available/i);
    await expect(linkArea).toBeVisible({ timeout: 5_000 });
  });

  test('running indicator (pulse dot) appears when timer is running', async ({ page }) => {
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForTimeout(500);

    // Collapse the panel to check the pill
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);

    // The pulse dot is .animate-pulse
    await expect(page.locator('.animate-pulse').first()).toBeVisible({ timeout: 3_000 });

    // Stop timer
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /pause/i }).first().click();
  });
});
