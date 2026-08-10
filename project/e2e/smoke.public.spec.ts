import { test, expect } from '@playwright/test'

test.describe('Public routes', () => {
  test('home page — loads and shows hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ApplyDay/)
    await expect(page.locator('h1')).toContainText('Land your next job')
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Login/i })).toBeVisible()
  })

  test('login page — form elements present', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Register/i })).toBeVisible()
  })

  test('register page — form loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[name="username"]')).toBeVisible()
  })

  test('forgot-password page — loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
  })

  test('wizard page — trial banner shown to guests', async ({ page }) => {
    await page.goto('/wizard')
    // Trial mode banner (blue)
    await expect(page.getByText(/Trial mode/i)).toBeVisible()
    // API key input
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // JD textarea (first of two textareas on the guest form)
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('protected routes redirect unauthenticated users to /login', async ({ page }) => {
    for (const route of ['/app', '/workspace', '/market', '/profile', '/settings']) {
      const res = await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
      // Navigate back to clean state for next iteration
      await page.goto('about:blank')
    }
  })
})
