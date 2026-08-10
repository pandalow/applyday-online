import { test, expect } from '@playwright/test'

const TAG = '[e2e-extract]'
const SAMPLE_JD = `${TAG} Senior Software Engineer at Acme Corp.
Requirements: 5+ years TypeScript, React, Node.js.
Responsibilities: Build scalable web applications, mentor junior engineers.`

test.describe('Extract (JD) API', () => {
  let appId: string
  let extractId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/applications', {
      data: { company: `${TAG} Corp`, jobTitle: 'Engineer' },
    })
    expect(res.status()).toBe(201)
    appId = (await res.json()).id
  })

  test.afterAll(async ({ request }) => {
    if (appId) await request.delete(`/api/applications/${appId}`).catch(() => {})
  })

  // ── POST ─────────────────────────────────────────────────────────────────

  test('POST /api/extract — creates extract with text', async ({ request }) => {
    const res = await request.post('/api/extract', {
      data: { text: SAMPLE_JD, applicationId: appId },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    extractId = body.id
  })

  test('POST /api/extract — 400 when text missing', async ({ request }) => {
    const res = await request.post('/api/extract', {
      data: { applicationId: appId },
    })
    expect(res.status()).toBe(400)
  })

  // ── GET list ─────────────────────────────────────────────────────────────

  test('GET /api/extract — returns array', async ({ request }) => {
    const res = await request.get('/api/extract')
    expect(res.status()).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })

  test('GET /api/extract?applicationId= — filters by application', async ({ request }) => {
    const res = await request.get(`/api/extract?applicationId=${appId}`)
    expect(res.status()).toBe(200)
    const items: { applicationId: string }[] = await res.json()
    for (const item of items) expect(item.applicationId).toBe(appId)
  })

  // ── Auth boundary ─────────────────────────────────────────────────────────

  test('GET /api/extract — 401 without session', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/extract')
    expect([401, 403]).toContain(res.status())
    await ctx.dispose()
  })
})
