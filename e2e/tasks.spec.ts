import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  test('page loads with status tabs', async ({ page }) => {
    // Should show tabs or sections for pending/in_progress/completed
    await expect(
      page.getByRole('tab', { name: /pending|all|tasks/i }).or(
        page.getByText(/pending/i)
      ).first()
    ).toBeVisible();
  });

  test('create a new task', async ({ page }) => {
    // Open the create form
    await page.getByRole('button', { name: /new task|add task|\+ task/i }).first().click();

    // Fill in the title
    const titleInput = page.getByPlaceholder(/task title|title/i).first();
    await titleInput.fill('E2E Test Task');

    // Submit
    await page.getByRole('button', { name: /^create$|^add$/i }).first().click();

    await expectToast(page, /task created/i);
    await expect(page.getByText('E2E Test Task')).toBeVisible({ timeout: 5_000 });
  });

  test('mark task as completed', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: /new task|add task|\+ task/i }).first().click();
    const titleInput = page.getByPlaceholder(/task title|title/i).first();
    await titleInput.fill('Task to complete');
    await page.getByRole('button', { name: /^create$|^add$/i }).first().click();
    await expectToast(page, /task created/i);

    // Find the task and check its checkbox
    const taskRow = page.locator('div, li').filter({ hasText: 'Task to complete' }).first();
    const checkbox = taskRow.getByRole('checkbox').first();
    await checkbox.check();

    await expectToast(page, /task updated|completed/i);
  });

  test('delete a task', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: /new task|add task|\+ task/i }).first().click();
    const titleInput = page.getByPlaceholder(/task title|title/i).first();
    await titleInput.fill('Task to delete');
    await page.getByRole('button', { name: /^create$|^add$/i }).first().click();
    await expectToast(page, /task created/i);

    // Find and delete it
    const taskRow = page.locator('div, li').filter({ hasText: 'Task to delete' }).first();
    await taskRow.hover();
    await taskRow.getByRole('button', { name: /delete|trash/i }).first().click();

    await expectToast(page, /task deleted/i);
    await expect(page.getByText('Task to delete')).not.toBeVisible({ timeout: 5_000 });
  });

  test('filter tasks by priority', async ({ page }) => {
    // Priority filter should exist
    const priorityFilter = page.getByRole('combobox').filter({ hasText: /priority|all/i }).first()
      .or(page.locator('select').first());
    await expect(priorityFilter).toBeVisible();
  });
});
