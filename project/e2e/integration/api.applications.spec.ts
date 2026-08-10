import { test, expect } from '@playwright/test'

const TAG = '[e2e]'

test.describe('Applications API', () => {
  let appId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { company: `${TAG} ACME Corp`, jobTitle: 'Senior Engineer' },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    appId = body.id
  })

  test.afterAll(async ({ request }) => {
    if (appId) await request.delete(`/api/applications/${appId}`).catch(() => {})
  })

  // ── GET list ────────────────────────────────────────────────────────────────

  test('GET /api/applications — returns array', async ({ request }) => {
    const res = await request.get('/api/applications')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/applications?search= — filters by company name', async ({ request }) => {
    const res = await request.get('/api/applications?search=ACME+Corp')
    expect(res.status()).toBe(200)
    const apps: { company: string }[] = await res.json()
    const match = apps.find((a) => a.company.includes('ACME Corp'))
    expect(match).toBeTruthy()
  })

  test('GET /api/applications?status= — filters by status', async ({ request }) => {
    const res = await request.get('/api/applications?status=preparing')
    expect(res.status()).toBe(200)
    const apps: { status: string }[] = await res.json()
    for (const app of apps) expect(app.status).toBe('preparing')
  })

  // ── GET single ──────────────────────────────────────────────────────────────

  test('GET /api/applications/:id — returns the created app', async ({ request }) => {
    const res = await request.get(`/api/applications/${appId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(appId)
    expect(body.company).toContain('ACME Corp')
    expect(body.jobTitle).toBe('Senior Engineer')
  })

  test('GET /api/applications/:id — 404 for unknown id', async ({ request }) => {
    const res = await request.get('/api/applications/00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  // ── PATCH ───────────────────────────────────────────────────────────────────

  test('PATCH /api/applications/:id — updates fields', async ({ request }) => {
    const res = await request.patch(`/api/applications/${appId}`, {
      data: { status: 'applied', jobTitle: 'Staff Engineer' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('applied')
    expect(body.jobTitle).toBe('Staff Engineer')
  })

  test('PATCH /api/applications/:id — 404 for unknown id', async ({ request }) => {
    const res = await request.patch('/api/applications/00000000-0000-0000-0000-000000000000', {
      data: { status: 'applied' },
    })
    expect(res.status()).toBe(404)
  })

  // ── POST validation ─────────────────────────────────────────────────────────

  test('POST /api/applications — 400 when company missing', async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { jobTitle: 'Engineer' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/applications — 400 when jobTitle missing', async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { company: 'Acme' },
    })
    expect(res.status()).toBe(400)
  })

  // ── Stats ───────────────────────────────────────────────────────────────────

  test('GET /api/applications/stats — returns expected shape', async ({ request }) => {
    const res = await request.get('/api/applications/stats')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.total).toBe('number')
    expect(typeof body.prepared).toBe('number')
    expect(typeof body.applied).toBe('number')
    expect(typeof body.interviewed).toBe('number')
    expect(typeof body.offered).toBe('number')
    expect(typeof body.rejected).toBe('number')
    expect(typeof body.last7Days).toBe('number')
    expect(Array.isArray(body.availableChannels)).toBe(true)
  })

  // ── Auth boundary ────────────────────────────────────────────────────────────

  test('GET /api/applications — 401 without session', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/applications')
    expect([401, 403]).toContain(res.status())
    await ctx.dispose()
  })
})
