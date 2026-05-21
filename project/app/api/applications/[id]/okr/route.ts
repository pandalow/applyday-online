import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import {
  applications, applicationOkrs, jobDescriptionTexts, jobDescriptions,
} from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { generateOKR } from '@/app/lib/ai/okr'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const okrs = await db.query.applicationOkrs.findMany({
    where: and(
      eq(applicationOkrs.applicationId, id),
      eq(applicationOkrs.userId, session.userId),
    ),
    orderBy: [desc(applicationOkrs.createdAt)],
  })

  return Response.json(okrs)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, session.userId)),
  })
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })

  // JD is required — refuse without extracted job description
  const jdText = await db.query.jobDescriptionTexts.findFirst({
    where: and(
      eq(jobDescriptionTexts.userId, session.userId),
      eq(jobDescriptionTexts.applicationId, id),
    ),
    with: { jobDescription: true },
  })
  if (!jdText?.jobDescription) {
    return Response.json(
      { error: 'No extracted job description found. Please paste the JD text and extract it first.' },
      { status: 422 },
    )
  }

  const apiKey = request.headers.get('X-AI-Key') ?? request.headers.get('X-OpenAI-Key')
  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 401 })

  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as import('@/app/lib/aiConfig').AIProvider
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  const body = await request.json() as { language?: 'en' | 'zh' }
  const language = body.language === 'zh' ? 'zh' : 'en'

  const jd = jdText.jobDescription

  try {
    const content = await generateOKR(
      {
        role: jd?.role ?? app.jobTitle,
        company: jd?.company ?? app.company,
        level: jd?.level ?? null,
        industry: jd?.industry ?? null,
        location: jd?.location ?? null,
        employment_type: jd?.employmentType ?? null,
        responsibilities: jd?.responsibilities ?? [],
        required_core_skills: jd?.requiredCoreSkills ?? [],
        desirable_skills: jd?.desirableSkills ?? [],
        frameworks_tools: jd?.frameworksTools ?? [],
        domain_keywords: jd?.domainKeywords ?? [],
      },
      language,
      apiKey,
      provider,
      modelId,
      reasoning,
    )

    const [okr] = await db
      .insert(applicationOkrs)
      .values({ applicationId: id, userId: session.userId, language, content })
      .returning()

    return Response.json(okr, { status: 201 })
  } catch (err) {
    console.error('[POST /api/applications/:id/okr]', err)
    return Response.json({ error: 'OKR generation failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  await db.delete(applicationOkrs).where(
    and(
      eq(applicationOkrs.applicationId, id),
      eq(applicationOkrs.userId, session.userId),
    ),
  )
  return new Response(null, { status: 204 })
}
