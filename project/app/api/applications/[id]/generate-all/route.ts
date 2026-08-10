import { type NextRequest } from 'next/server'
import { after } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/drizzle'
import { generationJobs, applications } from '@/app/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { processGenerationJobs } from '@/app/lib/ai/generateAllWorker'
import type { AIProvider } from '@/app/lib/aiConfig'

type Params = { params: Promise<{ id: string }> }

type JobType = typeof generationJobs.$inferInsert['type']

const JOB_ORDER: JobType[] = ['insight', 'resume', 'cover', 'okr']

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params

  const jobs = await db.query.generationJobs.findMany({
    where: and(
      eq(generationJobs.applicationId, applicationId),
      eq(generationJobs.userId, session.userId),
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return Response.json(jobs)
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params

  const apiKey = request.headers.get('X-AI-Key')
  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 400 })

  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as AIProvider
  const model = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  const body = await request.json() as { resumeId?: string; types?: string[] }
  const resumeId = body.resumeId ?? null

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, session.userId)),
  })
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })

  // Determine which job types to create (caller can restrict via types[])
  const defaultTypes: JobType[] = resumeId ? JOB_ORDER : ['insight', 'okr']
  const types: JobType[] = body.types
    ? (body.types.filter(t => JOB_ORDER.includes(t as JobType)) as JobType[])
    : defaultTypes

  // Idempotency: fetch existing pending/running jobs for this application
  const existing = await db.query.generationJobs.findMany({
    where: and(
      eq(generationJobs.applicationId, applicationId),
      eq(generationJobs.userId, session.userId),
      inArray(generationJobs.status, ['pending', 'running']),
    ),
  })

  const existingKeys = new Set(
    existing.map(j => `${j.type}:${j.resumeId ?? ''}`)
  )

  const toCreate = types.filter(
    type => !existingKeys.has(`${type}:${resumeId ?? ''}`)
  )

  if (toCreate.length === 0) {
    return Response.json({ jobIds: existing.map(j => j.id), skipped: true })
  }

  const inserted = await db.insert(generationJobs)
    .values(
      toCreate.map(type => ({
        applicationId,
        userId: session.userId,
        type,
        resumeId,
        apiKey,
        provider,
        model,
        reasoning,
      }))
    )
    .returning()

  const newJobIds = inserted.map(j => j.id)

  // Fire background processing — runs after response is sent
  after(async () => {
    await processGenerationJobs(newJobIds)
  })

  const allJobIds = [...existing.map(j => j.id), ...newJobIds]
  return Response.json({ jobIds: allJobIds }, { status: 202 })
}
