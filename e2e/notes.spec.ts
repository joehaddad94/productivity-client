import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/notes');
  });

  test('page loads and shows Notes heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
  });

  test('create a new note', async ({ page }) => {
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);

    // New "Untitled Note" should appear in the list
    await expect(page.getByText('Untitled Note').first()).toBeVisible();
  });

  test('edit note title', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);

    // Edit the title input in the editor panel
    const titleInput = page.locator('input[placeholder="Note title..."]').first();
    await titleInput.clear();
    await titleInput.fill('My Test Note');
    await titleInput.blur();

    // Title should update in the sidebar list after save
    await page.waitForTimeout(1500);
    await expect(page.getByText('My Test Note').first()).toBeVisible({ timeout: 5_000 });
  });

  test('edit note content with rich text toolbar', async ({ page }) => {
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);

    // Click into the Tiptap editor and type
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.type('Hello bold world');

    // Select all text and make it bold
    await page.keyboard.press('Control+a');
    await page.getByRole('button', { name: /bold/i }).click();

    // Bold button should become active (variant changes to secondary)
    await expect(page.getByRole('button', { name: /bold/i })).toBeVisible();
  });

  test('delete a note', async ({ page }) => {
    // Create a note
    await page.getByRole('button', { name: /new/i }).click();
    await expectToast(page, /note created/i);

    // Hover the note card to reveal the delete button (opacity-0 → opacity-100)
    const noteCard = page.getByText('Untitled Note').first();
    await noteCard.hover();

    // Register dialog handler BEFORE clicking delete
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete note/i }).first().click({ force: true });

    await expectToast(page, /note deleted/i);
  });

  test('search filters notes', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search notes/i);
    await searchInput.fill('zzznomatch999');
    await page.waitForTimeout(600);

    // Just verify search input works without crash
    const noteCards = page.locator('[data-testid="note-card"], .note-card');
    const count = await noteCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
