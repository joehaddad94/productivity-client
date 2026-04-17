import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Workspaces', () => {
  test('create a workspace', async ({ page }) => {
    const uniqueName = `E2E Workspace ${Date.now()}`;
    await goto(page, '/workspaces');

    // Open the create form
    await page.getByRole('button', { name: /create workspace/i }).first().click();

    await page.getByLabel('Name').first().fill(uniqueName);
    await page.getByRole('button', { name: /^create$/i }).first().click();

    await expectToast(page, /workspace created/i);
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 5_000 });
  });

  test('switch workspace via sidebar switcher', async ({ page }) => {
    // Create a second workspace to switch to
    await goto(page, '/workspaces');
    await page.getByRole('button', { name: /create workspace/i }).first().click();
    const secondName = `Switch Target ${Date.now()}`;
    await page.getByLabel('Name').first().fill(secondName);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /workspace created/i);

    // Navigate to dashboard and switch via sidebar dropdown
    await goto(page, '/dashboard');

    // Open workspace switcher dropdown
    await page.getByRole('button', { name: /switch workspace/i }).click();

    // Click the second workspace in the dropdown
    await page.getByText(secondName).first().click();

    // The switcher button should now contain the new workspace name
    await expect(
      page.getByRole('button', { name: /switch workspace/i })
    ).toContainText(secondName, { timeout: 5_000 });

    // Switch back to Playwright Workspace to restore state
    await page.getByRole('button', { name: /switch workspace/i }).click();
    await page.getByText('Playwright Workspace').first().click();
  });

  test('switch workspace from workspaces page', async ({ page }) => {
    // Create a second workspace if needed
    await goto(page, '/workspaces');
    await page.getByRole('button', { name: /create workspace/i }).first().click();
    const wsName = `Page Switch ${Date.now()}`;
    await page.getByLabel('Name').first().fill(wsName);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /workspace created/i);

    // Find the new workspace and click Switch
    const wsItem = page.locator('li').filter({ hasText: wsName }).first();
    await wsItem.getByRole('button', { name: /^switch$/i }).click();

    // The "Current" badge should now appear next to the new workspace
    await expect(wsItem.getByText(/current/i)).toBeVisible({ timeout: 5_000 });

    // Switch back to Playwright Workspace
    const pwItem = page.locator('li').filter({ hasText: 'Playwright Workspace' }).first();
    await pwItem.getByRole('button', { name: /^switch$/i }).click();
  });

  test('newly created workspace is selected and can create task immediately', async ({ page }) => {
    const wsName = `Auto Select ${Date.now()}`;
    const taskTitle = `Workspace task ${Date.now()}`;

    await goto(page, '/workspaces');
    await page.getByRole('button', { name: /create workspace/i }).first().click();
    await page.getByLabel('Name').first().fill(wsName);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /workspace created/i);

    // This specifically validates the fix: create should auto-select the new workspace.
    const wsItem = page.locator('li').filter({ hasText: wsName }).first();
    await expect(wsItem.getByText(/current/i)).toBeVisible({ timeout: 5_000 });

    await goto(page, '/tasks');
    await page.getByRole('button', { name: /new task/i }).first().click();
    await page.getByPlaceholder(/task title/i).first().fill(taskTitle);
    await page.getByRole('button', { name: /create task/i }).first().click();
    await expectToast(page, /task created/i);
    await expect(page.getByText(taskTitle).first()).toBeVisible({ timeout: 8_000 });
  });

  test('delete a workspace', async ({ page }) => {
    // Create a workspace specifically to delete
    await goto(page, '/workspaces');
    await page.getByRole('button', { name: /create workspace/i }).first().click();
    const uniqueName = `Workspace to delete ${Date.now()}`;
    await page.getByLabel('Name').first().fill(uniqueName);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await expectToast(page, /workspace created/i);

    // Click delete on the new workspace
    const wsItem = page.locator('li').filter({ hasText: uniqueName }).first();
    await wsItem.getByRole('button', { name: /delete workspace/i }).click();

    // Confirm in the AlertDialog
    await page.getByRole('button', { name: /delete workspace/i }).last().click();

    // Scope check to the workspace list so the closing dialog doesn't interfere
    await expect(page.locator('ul').getByText(uniqueName)).not.toBeVisible({ timeout: 5_000 });
  });

  test('empty workspace name shows validation error', async ({ page }) => {
    await goto(page, '/workspaces');
    await page.getByRole('button', { name: /create workspace/i }).first().click();

    // Submit with blank name
    await page.getByRole('button', { name: /^create$/i }).first().click();

    await expectToast(page, /name is required/i);
  });
});
