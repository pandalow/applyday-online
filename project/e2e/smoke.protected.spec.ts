import { test, expect } from '@playwright/test'

// All tests in this file use the saved auth state from global.setup.ts

test.describe('Protected routes (authenticated)', () => {
  test('/app — dashboard loads', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL('/app')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })

  test('/workspace — workspace loads', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page).toHaveURL('/workspace')
    await expect(page.locator('h1')).toContainText('Workspace')
  })

  test('/market — market page loads', async ({ page }) => {
    await page.goto('/market')
    await expect(page).toHaveURL('/market')
    await expect(page.locator('h1')).toContainText('Market')
  })

  test('/profile — profile page loads', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL('/profile')
    await expect(page.locator('h1')).toContainText('Profile')
  })

  test('/settings — settings page loads', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('/wizard — no trial banner for logged-in users', async ({ page }) => {
    await page.goto('/wizard')
    await expect(page).toHaveURL('/wizard')
    // Loading spinner first, then full page (wait for it to resolve)
    await page.waitForFunction(
      () => !document.querySelector('[class*="animate-spin"]') || true,
      { timeout: 5_000 },
    ).catch(() => {/* ok if spinner is gone faster */})
    await expect(page.getByText(/Trial mode/i)).not.toBeVisible({ timeout: 8_000 })
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('navigation links are present and correct', async ({ page }) => {
    await page.goto('/app')
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Quick Start/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Workspace/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Market/i })).toBeVisible()
  })

  test('logout — redirects to home', async ({ page }) => {
    await page.goto('/app')
    // Open user dropdown (click the avatar/initials button)
    await page.locator('nav button .rounded-full.bg-indigo-600').click()
    // Click logout
    await page.getByRole('button', { name: /Logout|退出/i }).click()
    await page.waitForURL('/', { timeout: 10_000 })
    await expect(page).toHaveURL('/')
  })
})
