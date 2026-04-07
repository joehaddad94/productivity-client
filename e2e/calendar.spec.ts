import { test, expect } from '@playwright/test';
import { goto, API } from './helpers';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

test.describe('Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/calendar');
  });

  test('page loads with Calendar heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /calendar/i }).first()
    ).toBeVisible();
  });

  test('current month and year are displayed', async ({ page }) => {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];
    const year = String(now.getFullYear());

    await expect(page.getByText(new RegExp(monthName, 'i')).first()).toBeVisible();
    await expect(page.getByText(year).first()).toBeVisible();
  });

  test('day-of-week labels are displayed', async ({ page }) => {
    // The calendar grid shows day abbreviations
    await expect(page.getByText('Sun').first()).toBeVisible();
    await expect(page.getByText('Mon').first()).toBeVisible();
    await expect(page.getByText('Sat').first()).toBeVisible();
  });

  test('navigate to next month', async ({ page }) => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthName = MONTH_NAMES[nextMonth.getMonth()];

    await page.getByRole('button', { name: /next month/i }).click();

    await expect(page.getByText(new RegExp(nextMonthName, 'i')).first()).toBeVisible({ timeout: 3_000 });
  });

  test('navigate to previous month', async ({ page }) => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthName = MONTH_NAMES[prevMonth.getMonth()];

    await page.getByRole('button', { name: /previous month/i }).click();

    await expect(page.getByText(new RegExp(prevMonthName, 'i')).first()).toBeVisible({ timeout: 3_000 });
  });

  test('Today button returns to current month', async ({ page }) => {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];

    // Navigate away first
    await page.getByRole('button', { name: /next month/i }).click();
    await page.getByRole('button', { name: /^today$/i }).click();

    await expect(page.getByText(new RegExp(monthName, 'i')).first()).toBeVisible({ timeout: 3_000 });
  });

  test('task with due date shows dot on correct date', async ({ page }) => {
    const workspaceId = await page.evaluate(() =>
      localStorage.getItem('tasky_current_workspace_id')
    );

    const now = new Date();
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;

    // Create a task with a due date on the 15th of the current month via API
    await page.request.post(`${API}/workspaces/${workspaceId}/tasks`, {
      data: { title: 'Calendar Dot Task', dueDate },
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // The 15th cell should have a dot indicator inside it
    const dayCell = page.locator(`button[data-date="${dueDate}"]`);
    await expect(dayCell).toBeVisible({ timeout: 5_000 });
    // Dot is a span inside the button
    await expect(dayCell.locator('span.rounded-full').first()).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a date shows tasks for that date', async ({ page }) => {
    const workspaceId = await page.evaluate(() =>
      localStorage.getItem('tasky_current_workspace_id')
    );

    const now = new Date();
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20`;

    await page.request.post(`${API}/workspaces/${workspaceId}/tasks`, {
      data: { title: 'Task For Day 20', dueDate },
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click on the 20th
    await page.locator(`button[data-date="${dueDate}"]`).click();

    // The selected day panel should show the task
    await expect(page.getByText('Task For Day 20').first()).toBeVisible({ timeout: 5_000 });
  });

  test('no API errors shown to user', async ({ page }) => {
    await expect(page.locator('main').getByText(/failed to load|could not load|something went wrong/i)).not.toBeVisible();
  });
});
