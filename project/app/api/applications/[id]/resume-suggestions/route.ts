import { type NextRequest } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/drizzle'
import { resumeSuggestions, resumeTexts, jobDescriptionTexts, applications } from '@/app/db/schema'
import type { SuggestionItem } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateResumeSuggestions } from '@/app/lib/ai/resumeSuggestions'

type Params = { params: Promise<{ id: string }> }

// GET: fetch latest suggestions for this application + resumeId
export async function GET(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params
  const resumeId = request.nextUrl.searchParams.get('resumeId')
  if (!resumeId) return Response.json({ error: 'resumeId is required' }, { status: 400 })

  const row = await db.query.resumeSuggestions.findFirst({
    where: and(
      eq(resumeSuggestions.applicationId, applicationId),
      eq(resumeSuggestions.resumeId, resumeId),
      eq(resumeSuggestions.userId, session.userId),
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return Response.json(row ?? null)
}

// POST: generate new suggestions
export async function POST(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params

  const apiKey = request.headers.get('X-AI-Key')
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as Parameters<typeof generateResumeSuggestions>[3]
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 400 })

  const body = await request.json() as { resumeId: string; language?: 'en' | 'zh' }
  if (!body.resumeId) return Response.json({ error: 'resumeId is required' }, { status: 400 })
  const language = body.language === 'zh' ? 'zh' : 'en'

  // Verify application belongs to user
  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, session.userId)),
  })
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })

  // Fetch resume text
  const resume = await db.query.resumeTexts.findFirst({
    where: and(eq(resumeTexts.id, body.resumeId), eq(resumeTexts.userId, session.userId)),
  })
  if (!resume) return Response.json({ error: 'Resume not found' }, { status: 404 })

  // Fetch JD (need extracted structured data)
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
    const generated = await generateResumeSuggestions(
      { text: resume.text },
      {
        role: jd?.role,
        company: jd?.company,
        requiredCoreSkills: jd?.requiredCoreSkills as string[],
        desirableSkills: jd?.desirableSkills as string[],
        frameworksTools: jd?.frameworksTools as string[],
        responsibilities: jd?.responsibilities as string[],
        domainKeywords: jd?.domainKeywords as string[],
      },
      apiKey,
      provider,
      modelId,
      reasoning,
      language,
    )

    const suggestions: SuggestionItem[] = generated.map(s => ({ ...s, status: 'pending' as const }))

    // Upsert: delete old + insert new
    await db.delete(resumeSuggestions).where(
      and(
        eq(resumeSuggestions.applicationId, applicationId),
        eq(resumeSuggestions.resumeId, body.resumeId),
        eq(resumeSuggestions.userId, session.userId),
      ),
    )

    const [created] = await db.insert(resumeSuggestions).values({
      applicationId,
      resumeId: body.resumeId,
      userId: session.userId,
      suggestions,
    }).returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[resume-suggestions POST]', err)
    return Response.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}

// PATCH: update a single suggestion's status (accept / dismiss)
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id: applicationId } = await params
  const body = await request.json() as { resumeId: string; suggestionId: string; status: 'accepted' | 'dismissed' | 'pending' }

  const row = await db.query.resumeSuggestions.findFirst({
    where: and(
      eq(resumeSuggestions.applicationId, applicationId),
      eq(resumeSuggestions.resumeId, body.resumeId),
      eq(resumeSuggestions.userId, session.userId),
    ),
  })
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = (row.suggestions as SuggestionItem[]).map(s =>
    s.id === body.suggestionId ? { ...s, status: body.status } : s
  )

  const [saved] = await db.update(resumeSuggestions)
    .set({ suggestions: updated })
    .where(eq(resumeSuggestions.id, row.id))
    .returning()

  return Response.json(saved)
}
