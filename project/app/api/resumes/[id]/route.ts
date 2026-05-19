import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { resumeTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const row = await db.query.resumeTexts.findFirst({
    where: and(eq(resumeTexts.id, id), eq(resumeTexts.userId, session.userId)),
  })

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(row)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await db.query.resumeTexts.findFirst({
    where: and(eq(resumeTexts.id, id), eq(resumeTexts.userId, session.userId)),
  })

  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { name, text } = body

    if (!name || !text) {
      return Response.json({ error: 'name and text are required' }, { status: 400 })
    }

    const [updated] = await db
      .update(resumeTexts)
      .set({ name, text })
      .where(and(eq(resumeTexts.id, id), eq(resumeTexts.userId, session.userId)))
      .returning()

    return Response.json(updated)
  } catch (err) {
    console.error('[PUT /api/resumes/:id]', err)
    return Response.json({ error: 'Failed to update resume' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await db.query.resumeTexts.findFirst({
    where: and(eq(resumeTexts.id, id), eq(resumeTexts.userId, session.userId)),
  })

  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await db
    .delete(resumeTexts)
    .where(and(eq(resumeTexts.id, id), eq(resumeTexts.userId, session.userId)))

  return new Response(null, { status: 204 })
}
