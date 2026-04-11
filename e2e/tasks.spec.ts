import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('page loads with status tabs', async ({ page }) => {
    await expect(
      page.getByRole('tab', { name: /pending/i }).or(
        page.getByText(/pending/i)
      ).first()
    ).toBeVisible();
  });

  test('create a new task', async ({ page }) => {
    // Open the CreateTaskModal — button now says "New task"
    await page.getByRole('button', { name: /new task/i }).first().click();

    // Fill in the title (placeholder is "Task title…" with unicode ellipsis)
    const titleInput = page.getByPlaceholder(/task title/i).first();
    await titleInput.fill('E2E Test Task');

    // Submit — button says "Create task"
    await page.getByRole('button', { name: /create task/i }).first().click();

    await expectToast(page, /task created/i);
    await expect(page.getByText('E2E Test Task').first()).toBeVisible({ timeout: 5_000 });
  });

  test('mark task as completed', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: /new task/i }).first().click();
    const titleInput = page.getByPlaceholder(/task title/i).first();
    await titleInput.fill('Task to complete');
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    // Find the task and check its checkbox
    await page.waitForTimeout(500);
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: 'Task to complete' }).first();
    const checkbox = taskRow.getByRole('checkbox').first();
    await checkbox.click();

    // Wait for the update to complete
    await page.waitForTimeout(1200);
    // Switch to Completed tab to verify task moved there
    await page.getByRole('tab', { name: /completed/i }).first().click();
    await expect(page.getByText('Task to complete').first()).toBeVisible({ timeout: 5_000 });
  });

  test('delete a task', async ({ page }) => {
    const uniqueTitle = `Task to delete ${Date.now()}`;
    // Create a task
    await page.getByRole('button', { name: /new task/i }).first().click();
    const titleInput = page.getByPlaceholder(/task title/i).first();
    await titleInput.fill(uniqueTitle);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle }).first();
    await expect(taskRow).toBeVisible({ timeout: 8_000 });

    // Register dialog BEFORE clicking delete
    page.once('dialog', (d) => d.accept());

    await taskRow.hover();
    await taskRow.getByRole('button', { name: /delete task/i }).first().click({ force: true });

    await expectToast(page, /task deleted/i);
    await expect(page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle })).toHaveCount(0, { timeout: 5_000 });
  });

  test('filter tasks by priority', async ({ page }) => {
    // Priority filter Radix combobox should exist in the toolbar
    const priorityFilter = page.getByRole('combobox').first();
    await expect(priorityFilter).toBeVisible();
  });

  test('priority filter actually filters tasks', async ({ page }) => {
    const uniqueTitle = `High Task ${Date.now()}`;

    // Open create modal
    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(uniqueTitle);

    // Priority is a native <select> in the modal — use selectOption
    await page.locator('select').first().selectOption('high');

    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 5_000 });

    // Apply "High" filter via the Radix Select in the toolbar
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 5_000 });

    // Switch filter to "Low" — high task should disappear
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /^low$/i }).click();
    await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5_000 });
  });

  test('task detail panel opens on row click', async ({ page }) => {
    const uniqueTitle = `Detail Task ${Date.now()}`;

    // Create a task
    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(uniqueTitle);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    // Wait for the row to appear, then click it
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle }).first();
    await expect(taskRow).toBeVisible({ timeout: 8_000 });
    await taskRow.locator('span.truncate').first().click();

    // TaskDrawer should open — title is "Task details" (lowercase)
    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    // Title is in a textarea now
    await expect(page.locator('textarea').filter({ hasText: uniqueTitle }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('task detail panel shows Linked Notes section', async ({ page }) => {
    // Create a task and open its detail panel
    const uniqueTitle = `Link-test-${Date.now()}`;
    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).fill(uniqueTitle);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);

    // Wait for task row then click to open drawer
    const linkTaskRow = page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle }).first();
    await expect(linkTaskRow).toBeVisible({ timeout: 8_000 });
    await linkTaskRow.locator('span.truncate').first().click();
    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/linked notes/i)).toBeVisible({ timeout: 3_000 });
  });

  test('empty task title shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).first().click();
    // Submit without filling title — button is disabled when title is empty
    // The button is disabled so we can't click it; verify it's disabled
    await expect(
      page.getByRole('button', { name: /create task/i }).first()
    ).toBeDisabled();
  });
});
