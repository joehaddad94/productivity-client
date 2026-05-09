import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

/**
 * E2E suite. Requires Next dev + API; setup hits POST /api/auth/dev-session.
 * Hosted: PLAYWRIGHT_BASE_URL=https://your-app.example.com (dev-session must be allowed on API).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-results.json' }]],

  timeout: 60_000,

  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: 'playwright/.auth/user.json',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: 'chromium',
      testMatch: /(auth|notes|projects|tasks|dashboard|calendar|analytics|settings|workspaces|navigation|pomodoro)\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
