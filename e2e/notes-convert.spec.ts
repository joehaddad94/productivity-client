import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Notes — Convert to task', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/notes');
  });

  test('"To task" button is visible in toolbar when note has no linked task', async ({ page }) => {
    // Create a fresh note
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTitle('Convert note to task')).toBeVisible({ timeout: 5_000 });
  });

  test('convert to task creates a task and shows toast', async ({ page }) => {
    // Create a note with a recognisable title
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);
    await page.waitForLoadState('networkidle');

    // Give it a unique title
    const title = `ConvertTest-${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Note title..."]').first();
    await titleInput.clear();
    await titleInput.fill(title);
    await titleInput.blur();
    await page.waitForTimeout(1200); // let debounce save

    // Click the "To task" button
    await page.getByTitle('Convert note to task').click();

    // Toast should appear
    await expectToast(page, /converted to task/i);
  });

  test('"To task" button disappears after conversion (note is now linked)', async ({ page }) => {
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);
    await page.waitForLoadState('networkidle');

    await page.getByTitle('Convert note to task').click();
    await expectToast(page, /converted to task/i);

    // After conversion the note has a linked task — "To task" button should be gone
    await page.waitForTimeout(1000);
    await expect(page.getByTitle('Convert note to task')).not.toBeVisible({ timeout: 5_000 });
  });

  test('linked task chip appears after conversion', async ({ page }) => {
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);
    await page.waitForLoadState('networkidle');

    await page.getByTitle('Convert note to task').click();
    await expectToast(page, /converted to task/i);

    // The link2 chip should appear showing the linked task
    await expect(page.getByTitle('Unlink task')).toBeVisible({ timeout: 5_000 });
  });
});
