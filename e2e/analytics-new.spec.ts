import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Analytics — Productivity score & heatmap', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/analytics');
  });

  test('productivity score card is visible', async ({ page }) => {
    await expect(page.getByText('Productivity Score')).toBeVisible({ timeout: 8_000 });
  });

  test('score ring renders (SVG circles present)', async ({ page }) => {
    // Wait for the score card to load
    await expect(page.getByText('Productivity Score')).toBeVisible({ timeout: 8_000 });
    // The ScoreRing SVG has circles with r=40 (large radius, not icon circles which have r=4)
    const ringCircles = page.locator('svg circle[r="40"]');
    await expect(ringCircles.first()).toBeAttached({ timeout: 5_000 });
    expect(await ringCircles.count()).toBeGreaterThanOrEqual(2);
  });

  test('score value is a number 0–100', async ({ page }) => {
    await expect(page.getByText('Productivity Score')).toBeVisible({ timeout: 8_000 });
    // The score text is a number next to "/ 100"
    const scoreText = await page.locator('text=/ 100').first().locator('..').textContent();
    const match = scoreText?.match(/\d+/);
    expect(match).not.toBeNull();
    const score = parseInt(match![0]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('contextual message below score is shown', async ({ page }) => {
    await expect(page.getByText('Productivity Score')).toBeVisible({ timeout: 8_000 });
    // One of the three possible messages
    const messages = [
      /excellent work/i,
      /good progress/i,
      /complete tasks and focus/i,
    ];
    let found = false;
    for (const msg of messages) {
      if (await page.getByText(msg).isVisible()) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  test('activity overview heatmap is visible', async ({ page }) => {
    await expect(page.getByText('Activity Overview')).toBeVisible({ timeout: 8_000 });
  });

  test('heatmap has cells with Less/More legend', async ({ page }) => {
    await expect(page.getByText('Less')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('More')).toBeVisible();
  });

  test('no crash or error shown on analytics page', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/failed to load analytics/i)).not.toBeVisible();
  });
});
