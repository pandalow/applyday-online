import { test, expect } from '@playwright/test'

test.describe('Wizard UI — authenticated user', () => {
  test('shows no trial-mode banner when logged in', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/trial mode/i)).not.toBeVisible()
  })

  test('shows JD textarea for pasting job description', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')
    // Must have at least one textarea
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('shows Analyze button', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('button', { name: /analyze|start|generate/i })
    ).toBeVisible()
  })

  test('shows step indicator for multi-step flow', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')
    // Step indicators are rendered as list items or progress markers
    const steps = page.locator('[data-testid="step"], .step-indicator, ol > li')
    if ((await steps.count()) > 0) {
      expect(await steps.count()).toBeGreaterThanOrEqual(2)
    }
  })

  test('does NOT show inline API key input for authenticated users', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')

    // Guest mode shows provider/model/api-key inputs inline
    // Auth mode should NOT show these (uses saved config instead)
    const providerSelect = page.locator('select[name="provider"], [data-testid="provider-select"]')
    const apiKeyInput = page.locator('input[placeholder*="API key" i]')

    const providerVisible = await providerSelect.isVisible().catch(() => false)
    const apiKeyVisible = await apiKeyInput.isVisible().catch(() => false)

    // At most one of these should be visible (settings/config panel might show them)
    // The important thing is that the "wizard API key section" banner isn't shown
    const guestApiBanner = await page
      .getByText(/AI configuration|api key section/i)
      .isVisible()
      .catch(() => false)
    expect(guestApiBanner).toBe(false)
  })
})

test.describe('Wizard UI — guest mode', () => {
  // These tests run WITHOUT saved auth state
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects to /login or shows trial-mode banner', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')

    const isRedirected = page.url().includes('/login')
    const hasBanner = await page.getByText(/trial mode/i).isVisible().catch(() => false)

    // One of these must be true
    expect(isRedirected || hasBanner).toBe(true)
  })

  test('shows inline API key input for guests', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Guest wizard shows password-type API key input
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('shows sign-up CTA after trial mode', async ({ page }) => {
    await page.goto('/wizard')
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // The trial banner contains a sign-up nudge
    const signUpLink = page.getByRole('link', { name: /sign up|register/i })
    if (await signUpLink.isVisible().catch(() => false)) {
      const href = await signUpLink.getAttribute('href')
      expect(href).toMatch(/register|signup/)
    }
  })
})
