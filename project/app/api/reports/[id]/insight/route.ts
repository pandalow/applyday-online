import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { analysisReports, analysisResults, summaries, resumeTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { generateInsights } from '@/app/lib/ai/insights'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  // Verify report ownership
  const report = await db.query.analysisReports.findFirst({
    where: and(eq(analysisReports.id, id), eq(analysisReports.userId, session.userId)),
  })

  if (!report) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { resumeId, languages } = body as {
      resumeId?: string
      languages?: string | string[]
    }

    // Determine language string (default: 'en')
    let language = 'en'
    if (typeof languages === 'string' && languages.trim()) {
      language = languages.trim()
    } else if (Array.isArray(languages) && languages.length > 0) {
      language = languages[0]
    }

    // Fetch analysis results for this report
    const results = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.reportId, id))

    // Build aggregated data object for the AI
    const data: Record<string, unknown> = {}
    for (const result of results) {
      data[result.name] = result.result
    }

    // Optionally fetch resume text
    let resumeText: string | undefined
    if (resumeId) {
      const resume = await db.query.resumeTexts.findFirst({
        where: and(eq(resumeTexts.id, resumeId), eq(resumeTexts.userId, session.userId)),
      })
      resumeText = resume?.text
    }

    // Generate AI insights
    const content = await generateInsights(data, resumeText, language)

    // Save as Summary record
    const [summary] = await db
      .insert(summaries)
      .values({ reportId: id, content })
      .returning()

    return Response.json(summary, { status: 201 })
  } catch (err) {
    console.error('[POST /api/reports/:id/insight]', err)
    return Response.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
