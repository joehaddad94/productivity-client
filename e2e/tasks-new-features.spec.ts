import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Tasks — due time', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('create form has no time input when no date is set', async ({ page }) => {
    // Time input is only rendered after a date is selected (conditionally rendered)
    await page.getByRole('button', { name: /new task/i }).first().click();
    await expect(page.locator('input[type="time"]')).not.toBeVisible();
  });

  test('time input becomes enabled after a date is picked', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).first().click();

    await page.locator('input[type="date"]').first().fill('2099-01-01');
    // Time input should now appear and be enabled
    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toBeVisible({ timeout: 3_000 });
    await expect(timeInput).toBeEnabled();
  });

  test('create task with date and time — shows "at HH:MM" on the row', async ({ page }) => {
    const title = `Timed Task ${Date.now()}`;

    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(title);
    await page.locator('input[type="date"]').first().fill('2099-06-15');
    await page.locator('input[type="time"]').first().fill('09:30');
    await page.getByRole('button', { name: /create task/i }).first().click();

    await expectToast(page, /task created/i);

    // Use search to reliably find the row — the unfiltered list may not have updated yet
    await page.getByLabel('Search tasks').fill(title);
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await expect(taskRow).toBeVisible({ timeout: 8_000 });
    await expect(taskRow.getByText(/at 09:30/i)).toBeVisible({ timeout: 5_000 });
  });

  test('detail panel shows Due Time input', async ({ page }) => {
    const title = `Detail Time Task ${Date.now()}`;

    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(title);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    await page.getByLabel('Search tasks').fill(title);
    const detailRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await expect(detailRow).toBeVisible({ timeout: 8_000 });
    await detailRow.locator('span.truncate').first().click();

    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    // Drawer has a "Time" label and a time input
    await expect(page.locator('input[type="time"]').first()).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Tasks — recurring tasks', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('create form has a Repeat selector', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).first().click();

    // The repeat field is a native <select> with placeholder option "No repeat"
    await expect(page.locator('select').last()).toBeVisible();
    await expect(page.locator('option[value=""]').last()).toHaveText(/no repeat/i);
  });

  test('create recurring task — badge shows on the row', async ({ page }) => {
    const title = `Weekly Task ${Date.now()}`;

    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(title);

    // Repeat is the second native <select> (after priority); use selectOption
    await page.locator('select').last().selectOption('WEEKLY');

    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    await page.getByLabel('Search tasks').fill(title);
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await expect(taskRow).toBeVisible({ timeout: 8_000 });
    await expect(taskRow.locator('[data-slot="badge"]').filter({ hasText: /weekly/i })).toBeVisible({ timeout: 5_000 });
  });

  test('detail panel shows Repeat selector', async ({ page }) => {
    const title = `Repeat Detail ${Date.now()}`;

    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(title);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    await page.getByLabel('Search tasks').fill(title);
    const detailRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await expect(detailRow).toBeVisible({ timeout: 8_000 });
    await detailRow.locator('span.truncate').first().click();

    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    // Drawer has a "Repeat" label
    await expect(page.getByText('Repeat', { exact: true }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('completing a recurring task spawns a new pending instance', async ({ page }) => {
    const title = `Recurring Daily ${Date.now()}`;

    // Create a daily recurring task with a due date (required for spawn to work)
    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(title);
    await page.locator('input[type="date"]').first().fill('2099-01-01');

    // Select daily recurrence using native select
    await page.locator('select').last().selectOption('DAILY');

    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    await page.waitForTimeout(500);

    // Complete the task via its checkbox
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await taskRow.getByRole('checkbox').first().click();
    await page.waitForTimeout(1_500);

    // Switch to Completed tab — original should be there
    await page.getByRole('tab', { name: /completed/i }).first().click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 });

    // Switch to Pending tab — new spawned instance should appear
    await page.getByRole('tab', { name: /pending/i }).first().click();
    await expect(
      page.locator('[data-testid="task-row"]').filter({ hasText: title }).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
