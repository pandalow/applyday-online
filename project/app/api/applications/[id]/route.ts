import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { applications } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and } from 'drizzle-orm'

const VALID_STATUSES = ['prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const
type ApplicationStatus = typeof VALID_STATUSES[number]

function isValidStatus(s: string): s is ApplicationStatus {
  return (VALID_STATUSES as readonly string[]).includes(s)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const row = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, session.userId)),
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

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, session.userId)),
  })

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { company, jobTitle, applicationDate, status, stageNotes, channel } = body

    const updates: Partial<typeof applications.$inferInsert> = {}
    if (company !== undefined)         updates.company = company
    if (jobTitle !== undefined)        updates.jobTitle = jobTitle
    if (applicationDate !== undefined) updates.applicationDate = new Date(applicationDate)
    if (stageNotes !== undefined)      updates.stageNotes = stageNotes
    if (channel !== undefined)         updates.channel = channel
    if (status !== undefined && isValidStatus(status)) updates.status = status

    if (Object.keys(updates).length === 0) {
      return Response.json(existing)
    }

    const [updated] = await db
      .update(applications)
      .set(updates)
      .where(and(eq(applications.id, id), eq(applications.userId, session.userId)))
      .returning()

    return Response.json(updated)
  } catch (err) {
    console.error('[PATCH /api/applications/:id]', err)
    return Response.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, session.userId)),
  })

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, session.userId)))

  return new Response(null, { status: 204 })
}
