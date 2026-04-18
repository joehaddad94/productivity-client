import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

/**
 * Playwright E2E config for Tasky frontend.
 *
 * Local: backend + `npm run dev`, then `npx playwright test`.
 * Hosted: `PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npx playwright test`
 * (API must expose /auth/dev-session via Next `/api` proxy — not on production API).
 *
 * CI: `.github/workflows/playwright-e2e.yml` runs the same suite on macOS + Windows.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,   // keep sequential — tests share one DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  timeout: 60_000,

  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Share auth state across all tests
    storageState: 'playwright/.auth/user.json',
  },

  projects: [
    // --- Setup project: runs once before everything else ---
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: { storageState: undefined },
    },

    // --- Main test suite ---
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
