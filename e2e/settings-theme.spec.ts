import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Settings — Theme toggle', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/settings');
    // Settings now uses tab navigation — click the Appearance tab to reveal theme controls
    await page.locator('nav').getByRole('button', { name: 'Appearance' }).first().click();
    await page.waitForTimeout(300);
  });

  test('Appearance section is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
    await expect(page.getByText('Customize the look and feel')).toBeVisible();
  });

  test('theme buttons are rendered', async ({ page }) => {
    await expect(page.getByRole('button', { name: /light/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /dark/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /system/i })).toBeVisible();
  });

  test('clicking Dark applies dark class to html', async ({ page }) => {
    await page.getByRole('button', { name: /dark/i }).click();
    await page.waitForTimeout(300);
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
  });

  test('clicking Light removes dark class from html', async ({ page }) => {
    // Switch to dark first
    await page.getByRole('button', { name: /dark/i }).click();
    await page.waitForTimeout(300);

    // Switch back to light
    await page.getByRole('button', { name: /light/i }).click();
    await page.waitForTimeout(300);

    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass ?? '').not.toContain('dark');
  });

  test('active theme button is highlighted', async ({ page }) => {
    // Click Dark — its button should gain bg-primary styling
    const darkBtn = page.getByRole('button', { name: /dark/i });
    await darkBtn.click();
    await page.waitForTimeout(300);

    // The active button has bg-primary class
    const cls = await darkBtn.getAttribute('class');
    expect(cls).toMatch(/bg-primary/);

    // Reset to light
    await page.getByRole('button', { name: /light/i }).click();
    await page.waitForTimeout(300);
  });
});
