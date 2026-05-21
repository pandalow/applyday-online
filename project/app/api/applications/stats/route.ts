import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { applications } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, count, and, gte, lte, inArray, isNotNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await verifySession()
  const { searchParams } = new URL(request.url)

  const dateFrom = searchParams.get('dateFrom')
  const dateTo   = searchParams.get('dateTo')
  const channels = searchParams.get('channels')?.split(',').filter(Boolean) ?? []

  // Build where conditions
  const conditions = [eq(applications.userId, session.userId)]
  if (dateFrom) conditions.push(gte(applications.applicationDate, new Date(dateFrom)))
  if (dateTo)   conditions.push(lte(applications.applicationDate, new Date(dateTo + 'T23:59:59')))
  if (channels.length) conditions.push(inArray(applications.channel, channels))

  const where = and(...conditions)

  // Stats grouped by status
  const rows = await db
    .select({ status: applications.status, total: count() })
    .from(applications)
    .where(where)
    .groupBy(applications.status)

  const stats = { total: 0, prepared: 0, applied: 0, interviewed: 0, offered: 0, rejected: 0 }
  for (const row of rows) {
    const n = Number(row.total)
    stats[row.status as keyof typeof stats] = n
    stats.total += n
  }

  // Last-7-days count — always computed regardless of current filters
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const [last7Row] = await db
    .select({ total: count() })
    .from(applications)
    .where(and(
      eq(applications.userId, session.userId),
      gte(applications.applicationDate, sevenDaysAgo),
    ))
  const last7Days = Number(last7Row?.total ?? 0)

  // Available channels for filter UI (always unfiltered — show all options)
  const channelRows = await db
    .selectDistinct({ channel: applications.channel })
    .from(applications)
    .where(and(eq(applications.userId, session.userId), isNotNull(applications.channel)))

  const availableChannels = channelRows
    .map(r => r.channel)
    .filter((c): c is string => !!c)
    .sort()

  return Response.json({ ...stats, last7Days, availableChannels })
}
