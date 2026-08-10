import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import { resolve } from 'path'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD

  if (!username || !password) {
    throw new Error(
      'E2E_USERNAME and E2E_PASSWORD must be set.\n' +
      'Copy .env.test.local.example → .env.test.local and fill in credentials.',
    )
  }

  mkdirSync(resolve('e2e/.auth'), { recursive: true })

  await page.goto('/login')
  await expect(page.locator('input[name="username"]')).toBeVisible()

  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')

  // Server Action redirect may take a moment
  await page.waitForURL('/app', { timeout: 20_000 })
  await expect(page).toHaveURL('/app')

  await page.context().storageState({ path: AUTH_FILE })
})
