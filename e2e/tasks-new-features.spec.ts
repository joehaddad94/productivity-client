import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Tasks — due time', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('create form has a disabled time input when no date is set', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).first().click();

    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toBeVisible();
    await expect(timeInput).toBeDisabled();
  });

  test('time input becomes enabled after a date is picked', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).first().click();

    await page.locator('input[type="date"]').first().fill('2099-01-01');
    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toBeEnabled();
  });

  test('create task with date and time — shows "at HH:MM" on the row', async ({ page }) => {
    const title = `Timed Task ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(title);
    await page.locator('input[type="date"]').first().fill('2099-06-15');
    await page.locator('input[type="time"]').first().fill('09:30');
    await page.getByRole('button', { name: /^create$/i }).first().click();

    await expectToast(page, /task created/i);

    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await expect(taskRow.getByText(/at 09:30/i)).toBeVisible({ timeout: 5_000 });
  });

  test('detail panel shows Due Time input', async ({ page }) => {
    const title = `Detail Time Task ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(title);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);

    await page.waitForTimeout(500);
    await page.locator('[data-testid="task-row"]').filter({ hasText: title }).first()
      .locator('p').filter({ hasText: title }).click();

    await expect(page.getByText('Task Details')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/due time/i)).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
  });
});

test.describe('Tasks — recurring tasks', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('create form has a Repeat selector', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).first().click();

    await expect(page.getByText('Repeat', { exact: true }).first()).toBeVisible();
  });

  test('create recurring task — badge shows on the row', async ({ page }) => {
    const title = `Weekly Task ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(title);

    // Open the Repeat selector (last combobox in the form after priority)
    const repeatSelect = page.getByRole('combobox').filter({ hasText: /no repeat/i }).first();
    await repeatSelect.click();
    await page.getByRole('option', { name: /^weekly$/i }).click();

    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);

    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    await expect(taskRow.locator('[data-slot="badge"]').filter({ hasText: /weekly/i })).toBeVisible({ timeout: 5_000 });
  });

  test('detail panel shows Repeat selector', async ({ page }) => {
    const title = `Repeat Detail ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(title);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);

    await page.waitForTimeout(500);
    await page.locator('[data-testid="task-row"]').filter({ hasText: title }).first()
      .locator('p').filter({ hasText: title }).click();

    await expect(page.getByText('Task Details')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Repeat', { exact: true }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('completing a recurring task spawns a new pending instance', async ({ page }) => {
    const title = `Recurring Daily ${Date.now()}`;

    // Create a daily recurring task with a due date (required for spawn to work)
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(title);
    await page.locator('input[type="date"]').first().fill('2099-01-01');

    const repeatSelect = page.getByRole('combobox').filter({ hasText: /no repeat/i }).first();
    await repeatSelect.click();
    await page.getByRole('option', { name: /^daily$/i }).click();

    await page.getByRole('button', { name: /^create$/i }).first().click();
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
