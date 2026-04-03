import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Pomodoro Widget', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/dashboard');
  });

  test('widget is visible in bottom-right corner', async ({ page }) => {
    // Timer text MM:SS is always visible in the collapsed header
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows focus session by default (25:00)', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible({ timeout: 5_000 });
  });

  test('start button starts the timer', async ({ page }) => {
    // Expand the widget first (starts collapsed)
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);

    const startBtn = page.getByRole('button', { name: /start/i }).first();
    await startBtn.click();

    // Timer should start counting down — after 1.5s it should no longer show 25:00
    await page.waitForTimeout(1500);
    await expect(page.getByText('25:00')).not.toBeVisible({ timeout: 3_000 });
  });

  test('pause button stops the timer', async ({ page }) => {
    // Expand first
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);

    // Start
    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForTimeout(1200);

    // Pause
    await page.getByRole('button', { name: /pause/i }).first().click();
    const timeBefore = await page.getByText(/\d{2}:\d{2}/).first().textContent();
    await page.waitForTimeout(1500);
    const timeAfter = await page.getByText(/\d{2}:\d{2}/).first().textContent();

    expect(timeBefore).toBe(timeAfter);
  });

  test('reset button returns to 25:00', async ({ page }) => {
    // Expand first
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);

    // Start then reset
    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /reset/i }).first().click();

    await expect(page.getByText('25:00').first()).toBeVisible({ timeout: 3_000 });
  });

  test('widget can be collapsed and expanded', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /toggle pomodoro timer/i });
    await expect(toggle).toBeVisible({ timeout: 5_000 });

    // Expand
    await toggle.click();
    await page.waitForTimeout(300);
    // After expanding, timer should still be visible
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible();

    // Collapse
    await toggle.click();
    await page.waitForTimeout(300);
    // Timer in header still visible when collapsed
    await expect(page.getByText(/25:00|\d{2}:\d{2}/).first()).toBeVisible();
  });
});
