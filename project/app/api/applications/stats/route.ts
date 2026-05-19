import { db } from '@/app/lib/drizzle'
import { applications } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, count } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  const rows = await db
    .select({ status: applications.status, total: count() })
    .from(applications)
    .where(eq(applications.userId, session.userId))
    .groupBy(applications.status)

  const stats = {
    total: 0,
    prepared: 0,
    applied: 0,
    interviewed: 0,
    offered: 0,
    rejected: 0,
  }

  for (const row of rows) {
    const n = Number(row.total)
    stats[row.status] = n
    stats.total += n
  }

  return Response.json(stats)
}
