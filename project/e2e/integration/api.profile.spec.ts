import { test, expect } from '@playwright/test'

test.describe('Profile API', () => {
  // ── GET ──────────────────────────────────────────────────────────────────

  test('GET /api/profile — returns user and profile shape', async ({ request }) => {
    const res = await request.get('/api/profile')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('user')
    expect(body.user).toHaveProperty('username')
    expect(body.user).toHaveProperty('email')
    expect(body).toHaveProperty('profile')
  })

  // ── PATCH ────────────────────────────────────────────────────────────────

  test('PATCH /api/profile — upserts bio field', async ({ request }) => {
    const bio = `E2E test bio ${Date.now()}`
    const res = await request.patch('/api/profile', {
      data: { bio },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.bio).toBe(bio)
  })

  test('PATCH /api/profile — empty patch returns profile unchanged', async ({ request }) => {
    const getRes = await request.get('/api/profile')
    const before = await getRes.json()

    const patchRes = await request.patch('/api/profile', { data: {} })
    expect(patchRes.status()).toBe(200)

    const after = await patchRes.json()
    expect(after.bio).toBe(before.profile?.bio ?? null)
  })
})
