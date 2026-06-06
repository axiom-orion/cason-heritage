// Playwright smoke tests for the Cason Heritage static site.
// Boots `serve` (which reads serve.json for the friendly routes) and drives
// the real pages in headless Chromium, enforcing a zero-console-error budget.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    // Some sandboxes intercept TLS with an untrusted CA; don't fail on that —
    // the zero-error budget below still catches real application JS errors.
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000/living',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
