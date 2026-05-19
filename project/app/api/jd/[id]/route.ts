import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { jobDescriptions, jobDescriptionTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq } from 'drizzle-orm'

async function getOwnedJD(id: string, userId: string) {
  const row = await db.query.jobDescriptions.findFirst({
    where: eq(jobDescriptions.id, id),
    with: { jobText: true },
  })

  if (!row || row.jobText.userId !== userId) return null
  return row
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const row = await getOwnedJD(id, session.userId)
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(row)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await getOwnedJD(id, session.userId)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    // Full update — strip id, jobTextId, and createdAt from the body
    const { id: _id, jobTextId: _jtId, createdAt: _ca, ...updateFields } = body

    const [updated] = await db
      .update(jobDescriptions)
      .set(updateFields)
      .where(eq(jobDescriptions.id, id))
      .returning()

    const jobText = await db.query.jobDescriptionTexts.findFirst({
      where: eq(jobDescriptionTexts.id, updated.jobTextId),
    })

    return Response.json({ ...updated, jobText })
  } catch (err) {
    console.error('[PUT /api/jd/:id]', err)
    return Response.json({ error: 'Failed to update job description' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await getOwnedJD(id, session.userId)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { id: _id, jobTextId: _jtId, createdAt: _ca, ...updateFields } = body

    if (Object.keys(updateFields).length === 0) {
      return Response.json(existing)
    }

    const [updated] = await db
      .update(jobDescriptions)
      .set(updateFields)
      .where(eq(jobDescriptions.id, id))
      .returning()

    const jobText = await db.query.jobDescriptionTexts.findFirst({
      where: eq(jobDescriptionTexts.id, updated.jobTextId),
    })

    return Response.json({ ...updated, jobText })
  } catch (err) {
    console.error('[PATCH /api/jd/:id]', err)
    return Response.json({ error: 'Failed to patch job description' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await getOwnedJD(id, session.userId)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.delete(jobDescriptions).where(eq(jobDescriptions.id, id))

  return new Response(null, { status: 204 })
}
