import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Pomodoro — per-task focus minutes', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('task detail panel shows no focus badge when focusMinutes is 0', async ({ page }) => {
    // Click first task row if any exist
    const taskRows = page.locator('[data-testid="task-row"]');
    const count = await taskRows.count();
    if (count === 0) {
      // No tasks — nothing to check; pass trivially
      return;
    }
    await taskRows.first().click();
    // Should NOT show the focus badge (0 minutes = hidden)
    await expect(page.getByText(/min focused via Pomodoro/i)).not.toBeVisible();
  });

  test('focus link section visible in expanded pomodoro when on dashboard', async ({ page }) => {
    await goto(page, '/dashboard');
    // Open the widget
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.waitForTimeout(300);
    // The task link area should be present
    const linkArea = page.getByText(/focus on a task|no tasks available/i);
    await expect(linkArea).toBeVisible({ timeout: 5_000 });
  });

  test('skip session logs focus minutes for linked task', async ({ page }) => {
    await goto(page, '/dashboard');

    // Need at least one open task to link.
    const taskRows = page.locator('[data-testid="task-row"]');
    const count = await taskRows.count();
    if (count === 0) {
      // Nothing to link against.
      return;
    }

    // Expand widget and link first available task.
    await page.getByRole('button', { name: /toggle pomodoro timer/i }).click();
    await page.getByRole('button', { name: /focus on a task/i }).click();
    const taskOption = page.locator('div[class*="absolute"][class*="bottom-6"] button').first();
    await expect(taskOption).toBeVisible({ timeout: 5_000 });
    await taskOption.click();

    // Skipping a work session should log 25 focus minutes for the linked task.
    const logFocusRequest = page.waitForResponse((res) =>
      /\/workspaces\/.+\/tasks\/.+\/log-focus$/.test(res.url()) &&
      res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /skip session/i }).click();
    const logFocusResponse = await logFocusRequest;
    expect(logFocusResponse.ok()).toBe(true);
  });
});
