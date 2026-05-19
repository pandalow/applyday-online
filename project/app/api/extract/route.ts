import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { jobDescriptionTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  const rows = await db
    .select()
    .from(jobDescriptionTexts)
    .where(eq(jobDescriptionTexts.userId, session.userId))
    .orderBy(desc(jobDescriptionTexts.createdAt))

  return Response.json(rows)
}

export async function POST(request: NextRequest) {
  const session = await verifySession()

  try {
    const body = await request.json()
    const { text, applicationId } = body

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'text is required' }, { status: 400 })
    }

    const [created] = await db
      .insert(jobDescriptionTexts)
      .values({
        userId: session.userId,
        text,
        applicationId: applicationId ?? null,
      })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[POST /api/extract]', err)
    return Response.json({ error: 'Failed to create job description text' }, { status: 500 })
  }
}
