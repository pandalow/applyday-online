import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { analysisReports } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  const reports = await db.query.analysisReports.findMany({
    where: eq(analysisReports.userId, session.userId),
    with: {
      results: true,
      summaries: true,
    },
    orderBy: [desc(analysisReports.createdAt)],
  })

  return Response.json(reports)
}

export async function POST(request: NextRequest) {
  const session = await verifySession()

  try {
    const body = await request.json()
    const { applicationIds } = body as { applicationIds?: string[] }

    if (!applicationIds?.length) {
      return Response.json({ error: 'applicationIds required' }, { status: 400 })
    }

    const [report] = await db
      .insert(analysisReports)
      .values({ userId: session.userId, status: 'pending' })
      .returning()

    return Response.json(report, { status: 202 })
  } catch (err) {
    console.error('[POST /api/reports]', err)
    return Response.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
