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
    // Open the create form — button says "Add Task"
    await page.getByRole('button', { name: /add task/i }).first().click();

    // Fill in the title
    const titleInput = page.getByPlaceholder('Task title...').first();
    await titleInput.fill('E2E Test Task');

    // Submit — button says "Create"
    await page.getByRole('button', { name: /^create$/i }).first().click();

    await expectToast(page, /task created/i);
    await expect(page.getByText('E2E Test Task').first()).toBeVisible({ timeout: 5_000 });
  });

  test('mark task as completed', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: /add task/i }).first().click();
    const titleInput = page.getByPlaceholder('Task title...').first();
    await titleInput.fill('Task to complete');
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);

    // Find the task and check its checkbox
    await page.waitForTimeout(500);
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: 'Task to complete' }).first();
    const checkbox = taskRow.getByRole('checkbox').first();
    await checkbox.click();

    // Wait for the update to complete (no success toast for updates)
    await page.waitForTimeout(1200);
    // Switch to Completed tab to verify task moved there
    await page.getByRole('tab', { name: /completed/i }).first().click();
    await expect(page.getByText('Task to complete').first()).toBeVisible({ timeout: 5_000 });
  });

  test('delete a task', async ({ page }) => {
    const uniqueTitle = `Task to delete ${Date.now()}`;
    // Create a task
    await page.getByRole('button', { name: /add task/i }).first().click();
    const titleInput = page.getByPlaceholder('Task title...').first();
    await titleInput.fill(uniqueTitle);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);

    await page.waitForTimeout(500);

    // Register dialog BEFORE clicking delete
    page.once('dialog', (d) => d.accept());

    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle }).first();
    await taskRow.hover();
    await taskRow.getByRole('button', { name: /delete task/i }).first().click({ force: true });

    await expectToast(page, /task deleted/i);
    await expect(page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle })).toHaveCount(0, { timeout: 5_000 });
  });

  test('filter tasks by priority', async ({ page }) => {
    // Priority filter combobox should exist
    const priorityFilter = page.getByRole('combobox').first();
    await expect(priorityFilter).toBeVisible();
  });

  test('priority filter actually filters tasks', async ({ page }) => {
    const uniqueTitle = `High Task ${Date.now()}`;

    // Open create form — form appears BEFORE the filter bar in the DOM
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(uniqueTitle);

    // The form's priority select is first; the filter bar's select is last
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();

    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);
    // After form closes only the filter combobox remains
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 5_000 });

    // Apply "High" filter
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 3_000 });

    // Switch filter to "Low" — high task should disappear
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /^low$/i }).click();
    await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 3_000 });
  });

  test('task detail panel opens on row click', async ({ page }) => {
    const uniqueTitle = `Detail Task ${Date.now()}`;

    // Create a task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('Task title...').first().fill(uniqueTitle);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /task created/i);

    // Click the task row (not checkbox, not delete)
    const taskRow = page.locator('[data-testid="task-row"]').filter({ hasText: uniqueTitle }).first();
    await taskRow.locator('p').filter({ hasText: uniqueTitle }).click();

    // Detail panel should open
    await expect(page.getByText('Task Details')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`input[value="${uniqueTitle}"]`)).toBeVisible({ timeout: 3_000 });
  });

  test('task detail panel shows Linked Notes section', async ({ page }) => {
    // Create a task and open its detail panel
    const uniqueTitle = `Link-test-${Date.now()}`;
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder(/task title/i).fill(uniqueTitle);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(500);

    // Click on the row to open detail panel
    await page.locator(`text=${uniqueTitle}`).first().click();
    await expect(page.getByText('Task Details')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/linked notes/i)).toBeVisible({ timeout: 3_000 });
  });

  test('empty task title shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).first().click();
    // Submit without filling title
    await page.getByRole('button', { name: /^create$/i }).first().click();

    await expectToast(page, /title is required/i);
  });
});
