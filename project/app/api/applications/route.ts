import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { applications } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and, desc, asc, ilike, or } from 'drizzle-orm'

const VALID_STATUSES = ['prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const
type ApplicationStatus = typeof VALID_STATUSES[number]

function isValidStatus(s: string): s is ApplicationStatus {
  return (VALID_STATUSES as readonly string[]).includes(s)
}

function buildOrderBy(sort: string) {
  const isDesc = sort.startsWith('-')
  const field = isDesc ? sort.slice(1) : sort
  const dir = isDesc ? desc : asc
  switch (field) {
    case 'applicationDate': return dir(applications.applicationDate)
    case 'company':         return dir(applications.company)
    case 'jobTitle':        return dir(applications.jobTitle)
    case 'status':          return dir(applications.status)
    default:                return dir(applications.createdAt)
  }
}

export async function GET(request: NextRequest) {
  const session = await verifySession()

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')?.trim() || undefined
  const statusParam = searchParams.get('status')?.trim() || undefined
  const sort = searchParams.get('sort') ?? '-createdAt'

  const statusFilter =
    statusParam && isValidStatus(statusParam) ? statusParam : undefined

  const rows = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, session.userId),
        search
          ? or(
              ilike(applications.company, `%${search}%`),
              ilike(applications.jobTitle, `%${search}%`),
            )
          : undefined,
        statusFilter ? eq(applications.status, statusFilter) : undefined,
      ),
    )
    .orderBy(buildOrderBy(sort))

  return Response.json(rows)
}

export async function POST(request: NextRequest) {
  const session = await verifySession()

  try {
    const body = await request.json()
    const { company, jobTitle, applicationDate, status, stageNotes, channel } = body

    if (!company || !jobTitle) {
      return Response.json(
        { error: 'company and jobTitle are required' },
        { status: 400 },
      )
    }

    const [created] = await db
      .insert(applications)
      .values({
        userId: session.userId,
        company,
        jobTitle,
        applicationDate: applicationDate ? new Date(applicationDate) : undefined,
        status: isValidStatus(status) ? status : 'prepared',
        stageNotes: stageNotes ?? null,
        channel: channel ?? null,
      })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[POST /api/applications]', err)
    return Response.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
