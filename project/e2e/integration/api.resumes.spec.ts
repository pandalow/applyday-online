import { test, expect } from '@playwright/test'

const TAG = '[e2e-resume]'

test.describe('Resumes API', () => {
  let resumeId: string

  test.afterAll(async ({ request }) => {
    if (resumeId) await request.delete(`/api/resumes/${resumeId}`).catch(() => {})
  })

  // ── GET list ─────────────────────────────────────────────────────────────

  test('GET /api/resumes — returns array', async ({ request }) => {
    const res = await request.get('/api/resumes')
    expect(res.status()).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })

  // ── POST ─────────────────────────────────────────────────────────────────

  test('POST /api/resumes — creates resume with text/plain upload', async ({ request }) => {
    // Build a minimal text file as multipart/form-data
    const textContent = `${TAG} John Doe resume. Skills: TypeScript, React.`
    const res = await request.post('/api/resumes', {
      multipart: {
        file: {
          name: 'test-resume.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from(textContent),
        },
      },
    })
    // Depending on implementation: 200 or 201
    expect([200, 201]).toContain(res.status())
    const body = await res.json()
    expect(body.id).toBeTruthy()
    resumeId = body.id
  })

  // ── GET single ───────────────────────────────────────────────────────────

  test('GET /api/resumes/:id — returns created resume', async ({ request }) => {
    if (!resumeId) test.skip()
    const res = await request.get(`/api/resumes/${resumeId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(resumeId)
  })

  test('GET /api/resumes/:id — 404 for unknown id', async ({ request }) => {
    const res = await request.get('/api/resumes/00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  // ── PUT ──────────────────────────────────────────────────────────────────

  test('PUT /api/resumes/:id — updates name and text', async ({ request }) => {
    if (!resumeId) test.skip()
    const res = await request.put(`/api/resumes/${resumeId}`, {
      data: { name: `${TAG} Updated Resume`, text: 'Updated resume text content.' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.name).toBe(`${TAG} Updated Resume`)
  })

  test('PUT /api/resumes/:id — 400 when name missing', async ({ request }) => {
    if (!resumeId) test.skip()
    const res = await request.put(`/api/resumes/${resumeId}`, {
      data: { text: 'some text' },
    })
    expect(res.status()).toBe(400)
  })

  // ── DELETE ───────────────────────────────────────────────────────────────

  test('DELETE /api/resumes/:id — returns 204', async ({ request }) => {
    if (!resumeId) test.skip()
    const res = await request.delete(`/api/resumes/${resumeId}`)
    expect(res.status()).toBe(204)
    resumeId = '' // already deleted, skip afterAll cleanup
  })

  test('DELETE /api/resumes/:id — 404 for unknown id', async ({ request }) => {
    const res = await request.delete('/api/resumes/00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  // ── Auth boundary ─────────────────────────────────────────────────────────

  test('GET /api/resumes — 401 without session', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await ctx.get('/api/resumes')
    expect([401, 403]).toContain(res.status())
    await ctx.dispose()
  })
})
