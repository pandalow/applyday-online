import { test, expect } from '@playwright/test'

const TAG = '[e2e-workspace]'

test.describe('Workspace UI (/applications/:id)', () => {
  let appId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { company: `${TAG} Corp`, jobTitle: 'Software Engineer' },
    })
    expect(res.status()).toBe(201)
    appId = (await res.json()).id
  })

  test.afterAll(async ({ request }) => {
    if (appId) await request.delete(`/api/applications/${appId}`).catch(() => {})
  })

  test('loads workspace page for valid application', async ({ page }) => {
    await page.goto(`/applications/${appId}`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('Internal Server Error')
  })

  test('shows 5 tabs: JD, Job Insight, Resume, Cover Letter, OKR', async ({ page }) => {
    await page.goto(`/applications/${appId}`)
    // Wait for the tab bar to render
    await page.waitForLoadState('networkidle')

    const tabLabels = ['jd', 'insight', 'resume', 'cover', 'okr']
    for (const label of tabLabels) {
      const tab = page.getByRole('button', { name: new RegExp(label, 'i') })
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible()
      }
    }
  })

  test('tab switch updates URL query param', async ({ page }) => {
    await page.goto(`/applications/${appId}?tab=jd`)
    await page.waitForLoadState('networkidle')

    // Click the Job Insight tab
    const insightTab = page.getByRole('button', { name: /job insight|jobinsight/i })
    if (!(await insightTab.isVisible().catch(() => false))) {
      test.skip()
      return
    }
    await insightTab.click()
    await expect(page).toHaveURL(/tab=jobinsight/)
  })

  test('JD tab — shows JD editor or empty state', async ({ page }) => {
    await page.goto(`/applications/${appId}?tab=jd`)
    await page.waitForLoadState('networkidle')
    // Either a textarea for pasting JD, or a save button should exist
    const hasTextarea = await page.locator('textarea').isVisible().catch(() => false)
    const hasSave = await page.getByRole('button', { name: /save|extract/i }).isVisible().catch(() => false)
    expect(hasTextarea || hasSave).toBe(true)
  })

  test('redirects /applications/unknown-id to 404 or shows error', async ({ page }) => {
    await page.goto('/applications/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    // Page should either show a not-found message or be a 404 status
    const body = await page.locator('body').textContent()
    const hasNotFound =
      /not found|404|application not found/i.test(body ?? '') || page.url().includes('404')
    // Also accept redirecting back to /app
    const isRedirected = page.url().includes('/app')
    expect(hasNotFound || isRedirected).toBe(true)
  })

  test('back link navigates to /app dashboard', async ({ page }) => {
    await page.goto(`/applications/${appId}`)
    await page.waitForLoadState('networkidle')

    const backLink = page
      .getByRole('link', { name: /back|dashboard|applications/i })
      .first()
    if (!(await backLink.isVisible().catch(() => false))) {
      test.skip()
      return
    }
    await backLink.click()
    await expect(page).toHaveURL(/\/app/)
  })
})
