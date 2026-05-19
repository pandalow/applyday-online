import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { analysisReports } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const report = await db.query.analysisReports.findFirst({
    where: and(eq(analysisReports.id, id), eq(analysisReports.userId, session.userId)),
    with: {
      results: true,
      summaries: true,
    },
  })

  if (!report) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(report)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const existing = await db.query.analysisReports.findFirst({
    where: and(eq(analysisReports.id, id), eq(analysisReports.userId, session.userId)),
  })

  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await db
    .delete(analysisReports)
    .where(and(eq(analysisReports.id, id), eq(analysisReports.userId, session.userId)))

  return new Response(null, { status: 204 })
}
