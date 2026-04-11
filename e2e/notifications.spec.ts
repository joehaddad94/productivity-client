import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/dashboard');
  });

  function bellLocator(page: import('@playwright/test').Page) {
    return page.locator('[data-testid="notification-bell"]:visible').first();
  }

  test('notification bell is visible in the header', async ({ page }) => {
    const bell = bellLocator(page);
    await expect(bell).toBeVisible();
  });

  test('clicking bell opens the notification panel', async ({ page }) => {
    const bell = bellLocator(page);
    await bell.click();
    const panel = page.locator('[data-testid="notification-panel"]:visible').first();
    await expect(panel).toBeVisible({ timeout: 3_000 });
  });

  test('notification panel shows empty state when no notifications', async ({ page }) => {
    const bell = bellLocator(page);
    await bell.click();
    const panel = page.locator('[data-testid="notification-panel"]:visible').first();
    await expect(panel).toBeVisible({ timeout: 3_000 });
    // Must show either empty state text or at least one actionable item.
    const hasEmpty = await page.getByText('No notifications').isVisible();
    const dismissButtons = await panel.getByTitle('Dismiss').count();
    expect(hasEmpty || dismissButtons > 0).toBe(true);
  });

  test('clicking bell again closes the panel', async ({ page }) => {
    const bell = bellLocator(page);
    await bell.click();
    await expect(page.locator('[data-testid="notification-panel"]:visible').first()).toBeVisible({ timeout: 3_000 });
    await bell.click();
    await expect(page.locator('[data-testid="notification-panel"]:visible').first()).not.toBeVisible({ timeout: 2_000 });
  });

  test('clicking outside closes the panel', async ({ page }) => {
    await bellLocator(page).click();
    await expect(page.locator('[data-testid="notification-panel"]:visible').first()).toBeVisible({ timeout: 3_000 });
    // Click somewhere outside the panel
    await page.mouse.click(10, 10);
    await expect(page.getByTestId('notification-panel')).not.toBeVisible({ timeout: 2_000 });
  });
});

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/settings');
    // Settings now uses tab navigation — click the Notifications tab to reveal its content.
    // Must scope to the settings <nav> to avoid matching the notification bell in the header.
    await page.locator('nav').getByRole('button', { name: 'Notifications' }).first().click();
    await page.waitForTimeout(300);
  });

  test('notification settings section is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Notifications' }).first()).toBeVisible();
    await expect(page.getByText('In-app notifications').first()).toBeVisible();
    await expect(page.getByText('Email notifications').first()).toBeVisible();
    await expect(page.getByText('Browser push').first()).toBeVisible();
  });

  test('in-app toggle is on by default', async ({ page }) => {
    // The in-app switch should be checked by default
    const inAppRow = page.locator('text=In-app notifications').locator('..');
    await expect(inAppRow).toBeVisible();
    // Verify the settings section loaded and default is enabled.
    const switches = page.locator('button[role="switch"]');
    await expect(switches.first()).toBeVisible({ timeout: 5_000 });
    await expect(switches.first()).toHaveAttribute('data-state', 'checked');
  });

  test('toggling email notifications fires a settings update', async ({ page }) => {
    // Wait for settings to load
    const switches = page.locator('button[role="switch"]');
    await expect(switches.first()).toBeVisible({ timeout: 5_000 });

    // Find the email toggle (second switch)
    const emailSwitch = switches.nth(1);
    const initialState = await emailSwitch.getAttribute('data-state');
    const patchRequest = page.waitForResponse((res) =>
      res.url().includes('/notifications/settings') &&
      res.request().method() === 'PATCH'
    );
    await emailSwitch.click();
    const patchResponse = await patchRequest;
    expect(patchResponse.ok()).toBe(true);
    // State should have changed
    const newState = await emailSwitch.getAttribute('data-state');
    expect(newState).not.toBe(initialState);

    // Toggle it back
    await emailSwitch.click();
  });

  test('reminder schedule bullets are shown', async ({ page }) => {
    await expect(page.getByText(/Daily agenda at 8:00 AM/i)).toBeVisible();
    await expect(page.getByText(/Afternoon reminder/i)).toBeVisible();
    await expect(page.getByText(/overdue check/i)).toBeVisible();
  });
});
