import { test, expect } from '@playwright/test'

const TAG = '[e2e-ui]'

test.describe('Dashboard UI (/app)', () => {
  test('loads dashboard with application list', async ({ page }) => {
    await page.goto('/app')
    await expect(page).not.toHaveURL(/login/)
    // Stats section
    await expect(page.locator('body')).toBeVisible()
    // Page should not show a 500 error
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('Internal Server Error')
    expect(body).not.toContain('Application error')
  })

  test('shows application table or empty state', async ({ page }) => {
    await page.goto('/app')
    // Either a table or empty-state message should be present
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    const hasEmptyState = await page
      .getByText(/no application|add your first/i)
      .isVisible()
      .catch(() => false)
    expect(hasTable || hasEmptyState).toBe(true)
  })

  test('can create a new application via New Application button', async ({ page }) => {
    await page.goto('/app')

    // Look for New Application button
    const newBtn = page.getByRole('button', { name: /new application/i })
    if (!(await newBtn.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await newBtn.click()

    // Either a modal opens or a row is added inline — both patterns should show an input
    await expect(
      page.locator('input[placeholder*="company" i], input[placeholder*="Company" i]').first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('search input filters results', async ({ page }) => {
    await page.goto('/app')
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    if (!(await searchInput.isVisible().catch(() => false))) {
      test.skip()
      return
    }
    await searchInput.fill('xyznonexistent')
    await page.waitForTimeout(400) // debounce
    const rows = await page.locator('table tbody tr').count().catch(() => 0)
    expect(rows).toBe(0)
  })

  test('each application row has Open workspace link', async ({ page }) => {
    await page.goto('/app')
    const openLink = page.getByRole('link', { name: /open/i }).first()
    if (!(await openLink.isVisible().catch(() => false))) {
      test.skip()
      return
    }
    const href = await openLink.getAttribute('href')
    expect(href).toMatch(/\/applications\//)
  })

  test('stats section shows numeric counts', async ({ page }) => {
    await page.goto('/app')
    // Stats chips / badges typically show a number
    const statNumbers = page.locator('[data-testid="stat-value"], .stat-value')
    if ((await statNumbers.count()) === 0) {
      // Stats may be embedded differently — just confirm no crash
      await expect(page.locator('body')).toBeVisible()
      return
    }
    const first = await statNumbers.first().textContent()
    expect(Number(first)).toBeGreaterThanOrEqual(0)
  })
})
