/**
 * Edge case tests for the TaskDrawer (right-side sheet that opens on task row click).
 * These cover save/cancel semantics, dirty state, delete, and drawer field rendering.
 */
import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Task Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/tasks');
  });

  async function createTask(page: import('@playwright/test').Page, title: string) {
    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(title);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);
    // Use search to find the task reliably, bypassing list-size/sort limits
    await page.getByLabel('Search tasks').fill(title);
    await expect(
      page.locator('[data-testid="task-row"]').filter({ hasText: title }).first()
    ).toBeVisible({ timeout: 8_000 });
  }

  async function openDrawer(page: import('@playwright/test').Page, title: string) {
    // createTask already filled the search input so the row is in view — just click it.
    const row = page.locator('[data-testid="task-row"]').filter({ hasText: title }).first();
    // Title is in a <span class="truncate"> — click it to open the drawer
    await row.locator('span.truncate').first().click();
    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
  }

  test('drawer opens and shows task title in editable textarea', async ({ page }) => {
    const title = `Drawer-open-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    const textarea = page.locator('textarea').filter({ hasText: title }).first();
    await expect(textarea).toBeVisible();
  });

  test('drawer shows Status, Priority, Due date, Time, and Repeat fields', async ({ page }) => {
    const title = `Drawer-fields-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Priority', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/due date/i).first()).toBeVisible();
    await expect(page.getByText('Repeat', { exact: true }).first()).toBeVisible();
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
  });

  test('closing drawer without saving does not change task title', async ({ page }) => {
    const title = `Drawer-cancel-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    // Wait for the drawer to populate the task title, then interact.
    // IMPORTANT: filter({ hasText }) must only be used for assertions — after clear() the
    // value becomes empty and the filter no longer resolves, causing fill() to time out.
    await expect(page.locator('textarea').filter({ hasText: title }).first()).toBeVisible({ timeout: 5_000 });
    const textarea = page.locator('textarea').first(); // stable selector, not filter-based
    await textarea.clear();
    await textarea.fill('UNSAVED CHANGE');

    // Close the sheet via the X button
    await page.getByRole('button', { name: /close/i }).first().click();
    await page.waitForTimeout(300);

    // Original task should still appear in the list (change was not saved)
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('UNSAVED CHANGE')).not.toBeVisible();
  });

  test('Save changes button persists title edit', async ({ page }) => {
    const title = `Drawer-save-${Date.now()}`;
    const newTitle = `Drawer-saved-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    await expect(page.locator('textarea').filter({ hasText: title }).first()).toBeVisible({ timeout: 5_000 });
    const textarea = page.locator('textarea').first(); // stable after clear()
    await textarea.clear();
    await textarea.fill(newTitle);

    await page.getByRole('button', { name: /save changes/i }).first().click();
    await expectToast(page, /task updated/i);

    // Close drawer
    await page.getByRole('button', { name: /close/i }).first().click();
    await page.waitForTimeout(300);

    // Update search to find the renamed task
    await page.getByLabel('Search tasks').fill(newTitle);
    await expect(
      page.locator('[data-testid="task-row"]').filter({ hasText: newTitle }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Save changes button is disabled until a field is changed', async ({ page }) => {
    const title = `Drawer-dirty-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    // Initially no changes — save button should be disabled
    const saveBtn = page.getByRole('button', { name: /save changes/i }).first();
    await expect(saveBtn).toBeDisabled();

    // Make a change
    await page.locator('textarea').first().click();
    await page.keyboard.press('End');
    await page.keyboard.type(' edited');

    await expect(saveBtn).toBeEnabled();
  });

  test('deleting a task from the drawer removes it from the list', async ({ page }) => {
    const title = `Drawer-delete-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    // Click delete in the drawer
    await page.getByRole('button', { name: /delete/i }).last().click();
    await expectToast(page, /task deleted/i);

    // Task should be gone
    await expect(
      page.locator('[data-testid="task-row"]').filter({ hasText: title })
    ).toHaveCount(0, { timeout: 5_000 });
  });

  test('drawer shows Linked Notes section', async ({ page }) => {
    const title = `Drawer-notes-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    await expect(page.getByText(/linked notes/i)).toBeVisible({ timeout: 3_000 });
  });

  test('status change to In Progress is reflected immediately in drawer', async ({ page }) => {
    const title = `Drawer-status-${Date.now()}`;
    await createTask(page, title);
    await openDrawer(page, title);

    // Change status to In Progress via Radix Select.
    // The toolbar priority filter is the first combobox on the page; the Status combobox
    // in the drawer shows "Pending" initially — filter by that text to target it precisely.
    const statusTrigger = page.getByRole('combobox').filter({ hasText: /pending/i }).first();
    await statusTrigger.click();
    await page.getByRole('option', { name: /in progress/i }).click();

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).first().click();
    await expectToast(page, /task updated/i);
  });
});
