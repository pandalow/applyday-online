import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Load test credentials from .env.test.local
const testEnv = resolve('.env.test.local')
if (existsSync(testEnv)) {
  for (const line of readFileSync(testEnv, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Step 1 — log in once, save session cookie
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Step 2a — public routes (no auth required)
    {
      name: 'smoke:public',
      testMatch: '**/smoke.public.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Step 2b — protected routes (depends on setup)
    {
      name: 'smoke:protected',
      testMatch: '**/smoke.protected.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Step 3 — integration tests (API + UI flows, depends on setup)
    {
      name: 'integration',
      testMatch: '**/integration/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
