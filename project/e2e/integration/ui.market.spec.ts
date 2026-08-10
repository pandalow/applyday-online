import { test, expect } from '@playwright/test'

test.describe('Market UI (/market)', () => {
  test('loads market page', async ({ page }) => {
    await page.goto('/market')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('Internal Server Error')
    expect(body).not.toContain('Application error')
  })

  test('shows report generation controls', async ({ page }) => {
    await page.goto('/market')
    await page.waitForLoadState('networkidle')
    // Should show either a generate button or existing reports
    const hasGenerateBtn = await page
      .getByRole('button', { name: /generate|create|new report/i })
      .isVisible()
      .catch(() => false)
    const hasReportList = await page
      .locator('[data-testid="report-item"], .report-card')
      .isVisible()
      .catch(() => false)
    const hasApplicationSelector = await page
      .locator('input[type="checkbox"], select')
      .isVisible()
      .catch(() => false)

    expect(hasGenerateBtn || hasReportList || hasApplicationSelector).toBe(true)
  })

  test('shows existing reports list if any', async ({ page }) => {
    await page.goto('/market')
    await page.waitForLoadState('networkidle')
    // No crash expected; just ensure page renders content
    const bodyText = await page.locator('body').textContent()
    expect(bodyText?.length).toBeGreaterThan(50)
  })
})
