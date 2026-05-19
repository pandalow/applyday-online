import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { jobDescriptionTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const row = await db.query.jobDescriptionTexts.findFirst({
    where: and(
      eq(jobDescriptionTexts.id, id),
      eq(jobDescriptionTexts.userId, session.userId),
    ),
  })

  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(row)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await db.query.jobDescriptionTexts.findFirst({
    where: and(
      eq(jobDescriptionTexts.id, id),
      eq(jobDescriptionTexts.userId, session.userId),
    ),
  })

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'text is required' }, { status: 400 })
    }

    const [updated] = await db
      .update(jobDescriptionTexts)
      .set({ text })
      .where(
        and(
          eq(jobDescriptionTexts.id, id),
          eq(jobDescriptionTexts.userId, session.userId),
        ),
      )
      .returning()

    return Response.json(updated)
  } catch (err) {
    console.error('[PATCH /api/extract/:id]', err)
    return Response.json({ error: 'Failed to update job description text' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await db.query.jobDescriptionTexts.findFirst({
    where: and(
      eq(jobDescriptionTexts.id, id),
      eq(jobDescriptionTexts.userId, session.userId),
    ),
  })

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .delete(jobDescriptionTexts)
    .where(
      and(
        eq(jobDescriptionTexts.id, id),
        eq(jobDescriptionTexts.userId, session.userId),
      ),
    )

  return new Response(null, { status: 204 })
}
