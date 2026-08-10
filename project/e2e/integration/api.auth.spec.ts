import { test, expect } from '@playwright/test'

test.describe('Auth API', () => {
  // ── /api/auth/check ──────────────────────────────────────────────────────

  test('GET /api/auth/check — returns isAuth true with valid session', async ({ request }) => {
    const res = await request.get('/api/auth/check')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.isAuth).toBe(true)
  })

  test('GET /api/auth/check — returns isAuth false without session', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/auth/check')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.isAuth).toBe(false)
    await ctx.dispose()
  })

  // ── /api/auth/register ────────────────────────────────────────────────────

  test('POST /api/auth/register — 400 when username missing', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.post('/api/auth/register', {
      data: { email: 'test@example.com', password: 'password123' },
    })
    expect(res.status()).toBe(400)
    await ctx.dispose()
  })

  test('POST /api/auth/register — 400 when email missing', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.post('/api/auth/register', {
      data: { username: 'testuser99', password: 'password123' },
    })
    expect(res.status()).toBe(400)
    await ctx.dispose()
  })

  test('POST /api/auth/register — 400 when password shorter than 8 chars', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.post('/api/auth/register', {
      data: { username: 'testuser99', email: 'test@example.com', password: 'short' },
    })
    expect(res.status()).toBe(400)
    await ctx.dispose()
  })

  test('POST /api/auth/register — 409 for duplicate username', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    // zxj000 is the test account that already exists
    const res = await ctx.post('/api/auth/register', {
      data: { username: 'zxj000', email: 'unique_email_xyz@example.com', password: 'password123' },
    })
    expect(res.status()).toBe(409)
    await ctx.dispose()
  })

  // ── protected endpoint without session ───────────────────────────────────

  test('GET /api/profile — 401 without session', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/profile')
    expect([401, 403]).toContain(res.status())
    await ctx.dispose()
  })
})
