import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for Tasky frontend.
 *
 * Requirements before running:
 *   1. Backend running:  cd productivity-server && npm run start:dev
 *   2. Frontend running: cd productivity-client && npm run dev
 *
 * Run tests:  npx playwright test
 * UI mode:   npx playwright test --ui
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,   // keep sequential — tests share one DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
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
