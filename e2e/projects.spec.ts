import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/projects');
  });

  test('page loads with Projects heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /projects/i }).first()
    ).toBeVisible();
  });

  test('create a project', async ({ page }) => {
    await page.getByRole('button', { name: /new project|\+ project/i }).first().click();

    const nameInput = page.getByPlaceholder(/project name|name/i).first();
    await nameInput.fill('E2E Project');

    await page.getByRole('button', { name: /^create$|^save$/i }).first().click();

    await expectToast(page, /project created/i);
    await expect(page.getByText('E2E Project')).toBeVisible({ timeout: 5_000 });
  });

  test('edit a project', async ({ page }) => {
    // Create first
    await page.getByRole('button', { name: /new project|\+ project/i }).first().click();
    await page.getByPlaceholder(/project name|name/i).first().fill('Project to Edit');
    await page.getByRole('button', { name: /^create$|^save$/i }).first().click();
    await expectToast(page, /project created/i);

    // Edit it
    const card = page.locator('div, article').filter({ hasText: 'Project to Edit' }).first();
    await card.getByRole('button', { name: /edit/i }).first().click();

    const editInput = page.getByPlaceholder(/project name|name/i).first();
    await editInput.clear();
    await editInput.fill('Renamed Project');
    await page.getByRole('button', { name: /^save$|^update$/i }).first().click();

    await expectToast(page, /project updated/i);
    await expect(page.getByText('Renamed Project')).toBeVisible({ timeout: 5_000 });
  });

  test('delete a project', async ({ page }) => {
    // Create first
    await page.getByRole('button', { name: /new project|\+ project/i }).first().click();
    await page.getByPlaceholder(/project name|name/i).first().fill('Project to Delete');
    await page.getByRole('button', { name: /^create$|^save$/i }).first().click();
    await expectToast(page, /project created/i);

    // Delete it
    const card = page.locator('div, article').filter({ hasText: 'Project to Delete' }).first();
    await card.getByRole('button', { name: /delete/i }).first().click();
    page.once('dialog', (d) => d.accept());
    await page.waitForTimeout(500);

    await expectToast(page, /project deleted/i);
    await expect(page.getByText('Project to Delete')).not.toBeVisible({ timeout: 5_000 });
  });

  test('project shows note count', async ({ page }) => {
    await page.getByRole('button', { name: /new project|\+ project/i }).first().click();
    await page.getByPlaceholder(/project name|name/i).first().fill('Count Project');
    await page.getByRole('button', { name: /^create$|^save$/i }).first().click();
    await expectToast(page, /project created/i);

    // Should show "0 notes" or similar
    const card = page.locator('div, article').filter({ hasText: 'Count Project' }).first();
    await expect(card.getByText(/note/i)).toBeVisible();
  });
});
