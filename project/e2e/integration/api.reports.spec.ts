import { test, expect } from '@playwright/test'

const TAG = '[e2e-report]'

test.describe('Reports API', () => {
  let appId: string
  let reportId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { company: `${TAG} Corp`, jobTitle: 'Analyst' },
    })
    expect(res.status()).toBe(201)
    appId = (await res.json()).id
  })

  test.afterAll(async ({ request }) => {
    if (reportId) await request.delete(`/api/reports/${reportId}`).catch(() => {})
    if (appId) await request.delete(`/api/applications/${appId}`).catch(() => {})
  })

  // ── GET list ─────────────────────────────────────────────────────────────

  test('GET /api/reports — returns array', async ({ request }) => {
    const res = await request.get('/api/reports')
    expect(res.status()).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })

  // ── POST ─────────────────────────────────────────────────────────────────

  test('POST /api/reports — creates report with applicationIds', async ({ request }) => {
    const res = await request.post('/api/reports', {
      data: { applicationIds: [appId] },
    })
    // 202 Accepted (background job kicked off)
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    reportId = body.id
  })

  test('POST /api/reports — 400 when applicationIds missing', async ({ request }) => {
    const res = await request.post('/api/reports', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/reports — 400 when applicationIds is empty array', async ({ request }) => {
    const res = await request.post('/api/reports', {
      data: { applicationIds: [] },
    })
    expect(res.status()).toBe(400)
  })

  // ── GET single ───────────────────────────────────────────────────────────

  test('GET /api/reports/:id — returns the created report', async ({ request }) => {
    if (!reportId) test.skip()
    const res = await request.get(`/api/reports/${reportId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(reportId)
  })

  test('GET /api/reports/:id — 404 for unknown id', async ({ request }) => {
    const res = await request.get('/api/reports/00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  // ── Auth boundary ─────────────────────────────────────────────────────────

  test('GET /api/reports — 401 without session', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/reports')
    expect([401, 403]).toContain(res.status())
    await ctx.dispose()
  })
})
