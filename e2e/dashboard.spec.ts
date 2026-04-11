import { test, expect } from '@playwright/test';
import { goto, expectToast } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/dashboard');
  });

  test('page loads with Dashboard heading', async ({ page }) => {
    // Heading is a time-of-day greeting, not a static "Dashboard" title
    await expect(
      page.getByRole('heading', { name: /(good morning|good afternoon|good evening)/i }).first()
    ).toBeVisible();
  });

  test('stat cards are visible', async ({ page }) => {
    // Right-column stats: Completed, Streak, Focus time
    await expect(page.getByText(/completed/i).first()).toBeVisible();
    await expect(page.getByText(/streak/i).first()).toBeVisible();
    await expect(page.getByText(/focus time/i).first()).toBeVisible();
  });

  test('stat card values are numeric', async ({ page }) => {
    // Stat values are rendered inside StatRow components with text-sm font-medium
    const statValues = await page.locator('.text-sm.font-medium').allTextContents();
    expect(statValues.length).toBeGreaterThan(0);
    for (const val of statValues) {
      expect(val).not.toMatch(/nan|undefined/i);
    }
  });

  test('Today section is visible', async ({ page }) => {
    // The dashboard now shows a "Today" section heading instead of "Pending Tasks"
    await expect(page.getByText(/\btoday\b/i).first()).toBeVisible();
  });

  test('Quick Add task input is visible', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/add a task and press enter/i)
    ).toBeVisible();
  });

  test('can add a task via Quick Add', async ({ page }) => {
    const input = page.getByPlaceholder(/add a task and press enter/i);
    await input.fill('Quick dashboard task');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expectToast(page, /task added|task created/i);
  });

  test('Pomodoro widget is visible', async ({ page }) => {
    // Timer always shows MM:SS
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('no API errors shown to user', async ({ page }) => {
    await expect(page.locator('main').getByText(/failed to load|could not load|something went wrong/i)).not.toBeVisible();
  });

  test('overdue section appears when an overdue task exists', async ({ page }) => {
    const API = 'http://localhost:8000';
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get workspace ID from API (page has auth cookies from storageState)
    const wsRes = await page.request.get(`${API}/workspaces`);
    const wsData = await wsRes.json();
    const workspaceId = wsData.workspaces?.[0]?.id ?? wsData[0]?.id;
    expect(workspaceId).toBeTruthy();

    // Create a task with a past due date directly via API
    const taskRes = await page.request.post(`${API}/workspaces/${workspaceId}/tasks`, {
      data: { title: 'E2E overdue task', dueDate: yesterday, status: 'pending' },
    });
    expect(taskRes.status()).toBe(201);

    // Reload dashboard — overdue section should appear
    await goto(page, '/dashboard');
    await expect(page.getByText(/overdue/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
