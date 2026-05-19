import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import {
  analysisReports,
  analysisResults,
  jobDescriptions,
  jobDescriptionTexts,
} from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, desc, and, inArray, gte, lte } from 'drizzle-orm'
import { Analyst } from '@/app/lib/analysis/analyst'

export async function GET() {
  const session = await verifySession()

  const reports = await db.query.analysisReports.findMany({
    where: eq(analysisReports.userId, session.userId),
    with: {
      results: true,
      summaries: true,
    },
    orderBy: [desc(analysisReports.createdAt)],
  })

  return Response.json(reports)
}

export async function POST(request: NextRequest) {
  const session = await verifySession()

  try {
    const body = await request.json()
    const { jobIds, startAt, endAt } = body as {
      jobIds?: string[]
      startAt?: string
      endAt?: string
    }

    // Build conditions to fetch user's JDs (join required since JDs have no userId)
    const jdRows = await db
      .select({ jd: jobDescriptions })
      .from(jobDescriptions)
      .innerJoin(
        jobDescriptionTexts,
        eq(jobDescriptions.jobTextId, jobDescriptionTexts.id),
      )
      .where(
        and(
          eq(jobDescriptionTexts.userId, session.userId),
          jobIds?.length ? inArray(jobDescriptions.id, jobIds) : undefined,
          startAt ? gte(jobDescriptions.createdAt, new Date(startAt)) : undefined,
          endAt   ? lte(jobDescriptions.createdAt, new Date(endAt))   : undefined,
        ),
      )

    if (!jdRows.length) {
      return Response.json(
        { error: 'No job descriptions found for the given criteria' },
        { status: 400 },
      )
    }

    // Map DB camelCase -> Analyst snake_case JobRecord shape
    const jobRecords = jdRows.map(({ jd }) => ({
      role:                 jd.role,
      company:              jd.company,
      responsibilities:     jd.responsibilities     ?? [],
      programming_languages: jd.programmingLanguages ?? [],
      frameworks_tools:     jd.frameworksTools       ?? [],
      cloud_platforms:      jd.cloudPlatforms        ?? [],
      databases:            jd.databases             ?? [],
      api_protocols:        jd.apiProtocols          ?? [],
      methodologies:        jd.methodologies         ?? [],
      level:                jd.level,
      location:             jd.location,
      employment_type:      jd.employmentType,
    }))

    const analyst = new Analyst(jobRecords)
    const analysisData = analyst.analyze()

    // Create the report record
    const [report] = await db
      .insert(analysisReports)
      .values({ userId: session.userId })
      .returning()

    // Save each analysis result as a row
    const resultRows = Object.entries(analysisData).map(([name, result]) => ({
      reportId: report.id,
      name,
      result: result as Record<string, unknown>,
    }))

    const savedResults = await db
      .insert(analysisResults)
      .values(resultRows)
      .returning()

    return Response.json({ ...report, results: savedResults, summaries: [] }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/reports]', err)
    return Response.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
