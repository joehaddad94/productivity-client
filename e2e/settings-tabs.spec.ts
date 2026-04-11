/**
 * Edge case tests for the Settings page tab navigation.
 * Each tab should render its own content section.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Settings — Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/settings');
  });

  test('Profile tab is active by default', async ({ page }) => {
    // Default tab is Profile
    await expect(page.getByText(/your name/i).or(page.getByText(/full name/i).or(page.getByText(/profile/i))).first()).toBeVisible();
  });

  test('Notifications tab shows notification toggles', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Notifications' }).first().click();
    await expect(page.getByText(/in-app notifications/i)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText(/email notifications/i)).toBeVisible();
    await expect(page.getByText(/browser push/i)).toBeVisible();
  });

  test('Appearance tab shows theme controls', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Appearance' }).first().click();
    await expect(page.getByText('Appearance').first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /light/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /dark/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /system/i })).toBeVisible();
  });

  test('Calendars tab shows calendar section', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Calendars' }).first().click();
    await expect(page.getByText(/calendar/i).first()).toBeVisible({ timeout: 3_000 });
  });

  test('switching between tabs hides previous tab content', async ({ page }) => {
    // Go to Appearance
    await page.locator('nav').getByRole('button', { name: 'Appearance' }).first().click();
    await expect(page.getByRole('button', { name: /dark/i })).toBeVisible({ timeout: 3_000 });

    // Switch to Notifications
    await page.locator('nav').getByRole('button', { name: 'Notifications' }).first().click();
    await expect(page.getByText(/in-app notifications/i)).toBeVisible({ timeout: 3_000 });

    // Appearance content should no longer be visible
    await expect(page.getByRole('button', { name: /^dark$/i })).not.toBeVisible();
  });

  test('reminder schedule bullets are shown in Notifications tab', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Notifications' }).first().click();
    await expect(page.getByText(/Daily agenda at 8:00 AM/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Afternoon reminder/i)).toBeVisible();
    await expect(page.getByText(/overdue check/i)).toBeVisible();
  });
});
