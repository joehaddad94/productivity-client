import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Navigation & Layout', () => {
  test('redirects unauthenticated users to login', async ({ browser }) => {
    // Use a fresh context with no auth state
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/notes');
    await expect(page).toHaveURL(/login|signin/, { timeout: 8_000 });
    await ctx.close();
  });

  test('authenticated user can navigate to Notes', async ({ page }) => {
    await goto(page, '/notes');
    await expect(page).toHaveURL(/notes/);
    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
  });

  test('authenticated user can navigate to Tasks', async ({ page }) => {
    await goto(page, '/tasks');
    await expect(page).toHaveURL(/tasks/);
  });

  test('authenticated user can navigate to Projects', async ({ page }) => {
    await goto(page, '/projects');
    await expect(page).toHaveURL(/projects/);
  });

  test('authenticated user can navigate to Analytics', async ({ page }) => {
    await goto(page, '/analytics');
    await expect(page).toHaveURL(/analytics/);
  });

  test('sidebar nav links work', async ({ page }) => {
    await goto(page, '/dashboard');
    // Click Notes in sidebar
    await page.getByRole('link', { name: /^notes$/i }).first().click();
    await expect(page).toHaveURL(/notes/, { timeout: 5_000 });
  });
});
