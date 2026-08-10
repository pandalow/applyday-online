import { type NextRequest } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/drizzle'
import { jobInsights, resumeTexts, jobDescriptionTexts, applications } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateJobInsight } from '@/app/lib/ai/jobInsight'
import type { AIProvider } from '@/app/lib/aiConfig'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params

  const row = await db.query.jobInsights.findFirst({
    where: and(
      eq(jobInsights.applicationId, applicationId),
      eq(jobInsights.userId, session.userId),
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return Response.json(row ?? null)
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params

  const apiKey = request.headers.get('X-AI-Key')
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as AIProvider
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 400 })

  const body = await request.json() as { resumeId?: string; language?: 'en' | 'zh' }
  const language = body.language === 'zh' ? 'zh' : 'en'

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, session.userId)),
  })
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })

  const jdText = await db.query.jobDescriptionTexts.findFirst({
    where: and(
      eq(jobDescriptionTexts.applicationId, applicationId),
      eq(jobDescriptionTexts.userId, session.userId),
    ),
  })
  if (!jdText) return Response.json({ error: 'No job description found. Please add a JD first.' }, { status: 422 })

  let resume = null
  if (body.resumeId) {
    resume = await db.query.resumeTexts.findFirst({
      where: and(eq(resumeTexts.id, body.resumeId), eq(resumeTexts.userId, session.userId)),
    })
  }

  try {
    const content = await generateJobInsight(
      jdText.text,
      resume ? { text: resume.text } : null,
      apiKey,
      provider,
      modelId,
      reasoning,
      language,
    )

    await db.delete(jobInsights).where(
      and(
        eq(jobInsights.applicationId, applicationId),
        eq(jobInsights.userId, session.userId),
      ),
    )

    const [created] = await db.insert(jobInsights).values({
      applicationId,
      userId: session.userId,
      resumeId: resume?.id ?? null,
      content,
    }).returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[job-insight POST]', err)
    const msg = err instanceof Error ? err.message : 'Failed to generate job insight'
    return Response.json({ error: msg }, { status: 500 })
  }
}
