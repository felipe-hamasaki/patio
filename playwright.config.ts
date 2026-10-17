import { defineConfig, devices } from '@playwright/test';
const production = process.env.PLAYWRIGHT_PRODUCTION === '1';
const remoteURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remoteURL ?? (production ? 'http://127.0.0.1:3003' : 'http://127.0.0.1:3002');
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: { timeout: 12000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        defaultBrowserType: 'chromium',
        deviceScaleFactor: 1,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: remoteURL
    ? undefined
    : {
        command: production ? 'npx next start --hostname 127.0.0.1 --port 3003' : 'npm run dev',
        url: `${baseURL}/demo`,
        reuseExistingServer: !production,
        timeout: 120000,
      },
});
