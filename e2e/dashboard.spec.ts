import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/dashboard');
  });

  test('page loads with Dashboard heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /dashboard/i }).first()
    ).toBeVisible();
  });

  test('stat cards are visible', async ({ page }) => {
    await expect(page.getByText(/tasks completed/i).first()).toBeVisible();
    await expect(page.getByText(/total tasks/i).first()).toBeVisible();
    await expect(page.getByText(/focus time/i).first()).toBeVisible();
    await expect(page.getByText(/streak/i).first()).toBeVisible();
  });

  test('stat card values are numeric', async ({ page }) => {
    // All stat card values should be numbers (not NaN or undefined)
    const statValues = await page.locator('.text-2xl.font-bold').allTextContents();
    expect(statValues.length).toBeGreaterThan(0);
    for (const val of statValues) {
      expect(val).not.toMatch(/nan|undefined/i);
      expect(val.trim().length).toBeGreaterThan(0);
    }
  });

  test('Pending Tasks section is visible', async ({ page }) => {
    await expect(page.getByText(/pending tasks/i).first()).toBeVisible();
  });

  test('Quick Add task input is visible', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/what do you need to do/i)
    ).toBeVisible();
  });

  test('can add a task via Quick Add', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you need to do/i);
    await input.fill('Quick dashboard task');
    await page.getByRole('button', { name: /add task/i }).click();

    await expectToast(page, /task added/i);
  });

  test('Pomodoro widget is visible', async ({ page }) => {
    // Timer always shows MM:SS
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('no API errors shown to user', async ({ page }) => {
    await expect(page.locator('main').getByText(/failed to load|could not load|something went wrong/i)).not.toBeVisible();
  });
});
