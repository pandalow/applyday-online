import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { jobDescriptions, jobDescriptionTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  // Join through jobDescriptionTexts to filter by userId
  const rows = await db
    .select({
      jd: jobDescriptions,
      jobText: jobDescriptionTexts,
    })
    .from(jobDescriptions)
    .innerJoin(
      jobDescriptionTexts,
      eq(jobDescriptions.jobTextId, jobDescriptionTexts.id),
    )
    .where(eq(jobDescriptionTexts.userId, session.userId))
    .orderBy(desc(jobDescriptions.createdAt))

  return Response.json(rows.map(r => ({ ...r.jd, jobText: r.jobText })))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()

  try {
    const body = await request.json()
    const { jobTextId, ...fields } = body

    if (!jobTextId) {
      return Response.json({ error: 'jobTextId is required' }, { status: 400 })
    }

    // Verify ownership of the jobDescriptionText
    const jdt = await db.query.jobDescriptionTexts.findFirst({
      where: eq(jobDescriptionTexts.id, jobTextId),
    })

    if (!jdt || jdt.userId !== session.userId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const [created] = await db
      .insert(jobDescriptions)
      .values({ jobTextId, ...fields })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[POST /api/jd]', err)
    return Response.json({ error: 'Failed to create job description' }, { status: 500 })
  }
}
