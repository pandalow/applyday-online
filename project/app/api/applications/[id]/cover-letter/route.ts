import { type NextRequest } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/drizzle'
import { coverLetters, resumeTexts, jobDescriptionTexts, applications } from '@/app/db/schema'
import type { CoverLetterTone } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateCoverLetter } from '@/app/lib/ai/coverLetter'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params
  const resumeId = request.nextUrl.searchParams.get('resumeId')
  if (!resumeId) return Response.json({ error: 'resumeId is required' }, { status: 400 })

  const row = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.applicationId, applicationId),
      eq(coverLetters.resumeId, resumeId),
      eq(coverLetters.userId, session.userId),
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return Response.json(row ?? null)
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params

  const apiKey = request.headers.get('X-AI-Key')
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as Parameters<typeof generateCoverLetter>[4]
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 400 })

  const body = await request.json() as { resumeId: string; tone?: CoverLetterTone; language?: 'en' | 'zh' }
  if (!body.resumeId) return Response.json({ error: 'resumeId is required' }, { status: 400 })

  const tone: CoverLetterTone = body.tone ?? 'professional'
  const language = body.language === 'zh' ? 'zh' : 'en'

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, session.userId)),
  })
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })

  const resume = await db.query.resumeTexts.findFirst({
    where: and(eq(resumeTexts.id, body.resumeId), eq(resumeTexts.userId, session.userId)),
  })
  if (!resume) return Response.json({ error: 'Resume not found' }, { status: 404 })

  const jdText = await db.query.jobDescriptionTexts.findFirst({
    where: and(
      eq(jobDescriptionTexts.applicationId, applicationId),
      eq(jobDescriptionTexts.userId, session.userId),
    ),
    with: { jobDescription: true },
  })
  if (!jdText) return Response.json({ error: 'No job description found for this application. Please add a JD first.' }, { status: 422 })

  const jd = jdText.jobDescription

  try {
    const content = await generateCoverLetter(
      { text: resume.text },
      {
        company: jd?.company,
        role: jd?.role,
        requiredCoreSkills: jd?.requiredCoreSkills as string[],
        responsibilities: jd?.responsibilities as string[],
        desirableSkills: jd?.desirableSkills as string[],
        frameworksTools: jd?.frameworksTools as string[],
      },
      tone,
      apiKey,
      provider,
      modelId,
      reasoning,
      language,
    )

    // Upsert: delete old for this app+resume combo, insert new
    await db.delete(coverLetters).where(
      and(
        eq(coverLetters.applicationId, applicationId),
        eq(coverLetters.resumeId, body.resumeId),
        eq(coverLetters.userId, session.userId),
      ),
    )

    const [created] = await db.insert(coverLetters).values({
      applicationId,
      resumeId: body.resumeId,
      userId: session.userId,
      tone,
      content,
    }).returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[cover-letter POST]', err)
    return Response.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params
  const body = await request.json() as { resumeId: string; content: string }

  if (!body.resumeId || !body.content) {
    return Response.json({ error: 'resumeId and content are required' }, { status: 400 })
  }

  const row = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.applicationId, applicationId),
      eq(coverLetters.resumeId, body.resumeId),
      eq(coverLetters.userId, session.userId),
    ),
  })
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

  const [saved] = await db.update(coverLetters)
    .set({ content: body.content, updatedAt: new Date() })
    .where(eq(coverLetters.id, row.id))
    .returning()

  return Response.json(saved)
}
