import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://localhost:4000/api/v1/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
      env: {
        MONGODB_URI: process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/dengueahead',
        NODE_ENV: 'test'
      }
    },
    {
      command: 'npm run dev:web',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000
    }
  ]
});
