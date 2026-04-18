import { test, expect, type Page } from '@playwright/test';
import { goto, expectToast } from './helpers';

const EDITOR_TAG_INPUT = '[data-testid="editor-tag-input"]';
const EDITOR_TAG_ROW = '[data-testid="editor-tag-row"]';
const FILTER_BAR = '[data-testid="tag-filter-bar"]';

async function createNote(page: Page) {
  await page.getByRole('button', { name: /new/i }).first().click();
  await expectToast(page, /note created/i);
  await expect(page.locator('input[placeholder="Untitled"]').first()).toBeVisible({
    timeout: 10_000,
  });
  // Let the list refetch settle so the tag input is wired to the server-saved note id.
  await page.waitForTimeout(800);
}

async function addTagsViaEditor(page: Page, value: string, key: 'Enter' | 'Tab' = 'Enter') {
  const input = page.locator(EDITOR_TAG_INPUT);
  await input.click();
  await input.fill(value);
  await input.press(key);
}

async function editorChip(page: Page, tag: string) {
  return page.locator(`${EDITOR_TAG_ROW} [data-testid="tag-chip"][data-tag="${tag}"]`);
}

async function filterChip(page: Page, tag: string) {
  return page.locator(`${FILTER_BAR} [data-testid="tag-chip"][data-tag="${tag}"]`);
}

test.describe('Tags', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/notes');
  });

  test('add tags via Enter, comma, and Tab separators', async ({ page }) => {
    await createNote(page);

    // Enter: one-at-a-time
    await addTagsViaEditor(page, 'e2e-enter', 'Enter');
    await expect(await editorChip(page, 'e2e-enter')).toBeVisible({ timeout: 5_000 });

    // Comma: bulk paste of 3 values
    await addTagsViaEditor(page, 'e2e-alpha, e2e-beta, e2e-gamma', 'Enter');
    // Typing a comma triggers immediate commit; the last piece stays until Enter/Tab.
    await expect(await editorChip(page, 'e2e-alpha')).toBeVisible({ timeout: 5_000 });
    await expect(await editorChip(page, 'e2e-beta')).toBeVisible();
    await expect(await editorChip(page, 'e2e-gamma')).toBeVisible();

    // Tab: single value
    await addTagsViaEditor(page, 'e2e-tab', 'Tab');
    await expect(await editorChip(page, 'e2e-tab')).toBeVisible({ timeout: 5_000 });
  });

  test('remove tag shows Undo toast and restores it', async ({ page }) => {
    await createNote(page);
    await addTagsViaEditor(page, 'e2e-undo', 'Enter');
    const chip = await editorChip(page, 'e2e-undo');
    await expect(chip).toBeVisible({ timeout: 5_000 });

    await chip.locator('[data-testid="tag-chip-remove"]').click();
    await expect(chip).toHaveCount(0, { timeout: 3_000 });

    const toast = page.locator('[data-sonner-toast]').filter({ hasText: /removed/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await toast.getByRole('button', { name: /undo/i }).click();

    await expect(await editorChip(page, 'e2e-undo')).toBeVisible({ timeout: 5_000 });
  });

  test('chip colour is stable across reloads', async ({ page }) => {
    await createNote(page);
    await addTagsViaEditor(page, 'e2e-colour', 'Enter');
    const chip = await editorChip(page, 'e2e-colour');
    await expect(chip).toBeVisible({ timeout: 5_000 });
    const before = await chip.evaluate((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      bd: getComputedStyle(el).borderColor,
      idx: el.getAttribute('data-palette-index'),
    }));

    await page.reload();
    await page.waitForLoadState('load');
    const chipAfter = await editorChip(page, 'e2e-colour');
    await expect(chipAfter.first()).toBeVisible({ timeout: 10_000 });
    const after = await chipAfter.first().evaluate((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      bd: getComputedStyle(el).borderColor,
      idx: el.getAttribute('data-palette-index'),
    }));
    expect(after.idx).toBe(before.idx);
    expect(after.bg).toBe(before.bg);
    expect(after.bd).toBe(before.bd);
  });

  test('clicking a chip in the editor toggles the filter', async ({ page }) => {
    await createNote(page);
    await addTagsViaEditor(page, 'e2e-click', 'Enter');
    const editor = await editorChip(page, 'e2e-click');
    await expect(editor).toBeVisible({ timeout: 5_000 });

    await editor.click();
    const filter = await filterChip(page, 'e2e-click');
    await expect(filter).toHaveAttribute('data-active', 'true', { timeout: 5_000 });

    await filter.click();
    await expect(filter).not.toHaveAttribute('data-active', 'true', { timeout: 5_000 });
  });

  test('multi-tag filter All vs Any changes matching notes', async ({ page }) => {
    const suffix = Date.now();
    const tagA = `e2e-multi-a-${suffix}`;
    const tagB = `e2e-multi-b-${suffix}`;

    await createNote(page);
    await addTagsViaEditor(page, `${tagA}, ${tagB}`, 'Enter');
    await expect(await editorChip(page, tagA)).toBeVisible();
    await expect(await editorChip(page, tagB)).toBeVisible();

    await createNote(page);
    await addTagsViaEditor(page, tagA, 'Enter');
    await expect(await editorChip(page, tagA)).toBeVisible();

    await (await filterChip(page, tagA)).click();
    await (await filterChip(page, tagB)).click();
    const toggle = page.locator('[data-testid="tag-mode-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 5_000 });

    await page.locator('[data-testid="tag-mode-any"]').click();
    await page.waitForTimeout(500);
    const anyCount = await page.locator('.relative.group').count();

    await page.locator('[data-testid="tag-mode-all"]').click();
    await page.waitForTimeout(500);
    const allCount = await page.locator('.relative.group').count();

    expect(allCount).toBeLessThan(anyCount);
    expect(allCount).toBeGreaterThanOrEqual(1);
  });

  test('rename a workspace tag updates all notes', async ({ page }) => {
    await createNote(page);
    const original = `e2e-rename-${Date.now()}`;
    const renamed = `${original}-v2`;
    await addTagsViaEditor(page, original, 'Enter');
    await expect(await editorChip(page, original)).toBeVisible({ timeout: 5_000 });

    // Open manage dialog (dashed Manage button or overflow + button)
    const manageBtn = page
      .locator('[data-testid="tag-filter-manage"], [data-testid="tag-filter-overflow"]')
      .first();
    await manageBtn.click();
    const dialog = page.locator('[data-testid="manage-tags-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const row = dialog.locator(`[data-testid="manage-tags-row"][data-tag="${original}"]`);
    await row.locator('[data-testid="manage-tags-rename"]').click();
    const input = dialog.locator('[data-testid="manage-tags-rename-input"]');
    await input.fill(renamed);
    await input.press('Enter');
    await expectToast(page, new RegExp(`renamed`, 'i'));

    await page.keyboard.press('Escape');
    await expect(await editorChip(page, renamed)).toBeVisible({ timeout: 5_000 });
    await expect(await editorChip(page, original)).toHaveCount(0);
  });

  test('delete a workspace tag removes it from filter bar and notes', async ({ page }) => {
    await createNote(page);
    const target = `e2e-wipe-${Date.now()}`;
    await addTagsViaEditor(page, target, 'Enter');
    await expect(await editorChip(page, target)).toBeVisible({ timeout: 5_000 });

    const manageBtn = page
      .locator('[data-testid="tag-filter-manage"], [data-testid="tag-filter-overflow"]')
      .first();
    await manageBtn.click();
    const dialog = page.locator('[data-testid="manage-tags-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const row = dialog.locator(`[data-testid="manage-tags-row"][data-tag="${target}"]`);
    await row.locator('[data-testid="manage-tags-delete"]').click();

    await page.getByRole('button', { name: /delete tag/i }).click();
    await expectToast(page, /removed/i);

    await page.keyboard.press('Escape');
    await expect(await editorChip(page, target)).toHaveCount(0, { timeout: 5_000 });
    await expect(await filterChip(page, target)).toHaveCount(0);
  });

  test('optimistic tag add updates DOM within 50ms', async ({ page }) => {
    await createNote(page);

    // Block the network response so only the optimistic cache update paints the chip.
    await page.route('**/notes/*/tags', (route) => {
      setTimeout(() => route.continue(), 2_000);
    });

    const tag = `e2e-opt-${Date.now()}`;
    const input = page.locator(EDITOR_TAG_INPUT);
    await input.click();
    await input.fill(tag);

    const elapsed = await page.evaluate(async (t: string) => {
      const start = performance.now();
      const row = document.querySelector('[data-testid="editor-tag-row"]');
      if (!row) return -1;
      return new Promise<number>((resolve) => {
        const observer = new MutationObserver(() => {
          const chip = row.querySelector(`[data-testid="tag-chip"][data-tag="${t}"]`);
          if (chip) {
            observer.disconnect();
            resolve(performance.now() - start);
          }
        });
        observer.observe(row, { childList: true, subtree: true });
        const input = document.querySelector<HTMLInputElement>(
          '[data-testid="editor-tag-input"]',
        );
        if (input) {
          input.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
          );
        }
        setTimeout(() => {
          observer.disconnect();
          resolve(-1);
        }, 2_000);
      });
    }, tag);

    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(50);
    await page.unroute('**/notes/*/tags');
  });
});
