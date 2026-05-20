import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import {
  analysisReports,
  analysisResults,
  jobDescriptions,
  jobDescriptionTexts,
} from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { extractJobDescription } from '@/app/lib/ai/extract'
import { Analyst } from '@/app/lib/analysis/analyst'
import { eq, and } from 'drizzle-orm'

function mapJDToRecord(jd: typeof jobDescriptions.$inferSelect) {
  return {
    role:                  jd.role,
    company:               jd.company,
    responsibilities:      jd.responsibilities      ?? [],
    programming_languages: jd.programmingLanguages  ?? [],
    frameworks_tools:      jd.frameworksTools        ?? [],
    cloud_platforms:       jd.cloudPlatforms         ?? [],
    databases:             jd.databases              ?? [],
    api_protocols:         jd.apiProtocols           ?? [],
    methodologies:         jd.methodologies          ?? [],
    level:                 jd.level,
    location:              jd.location,
    employment_type:       jd.employmentType,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const report = await db.query.analysisReports.findFirst({
    where: and(
      eq(analysisReports.id, id),
      eq(analysisReports.userId, session.userId),
    ),
  })

  if (!report) return Response.json({ error: 'Not found' }, { status: 404 })
  if (report.status !== 'pending') return Response.json({ error: 'Already processed' }, { status: 409 })

  const apiKey = request.headers.get('X-AI-Key') ?? request.headers.get('X-OpenAI-Key')
  if (!apiKey) {
    await db.update(analysisReports).set({ status: 'failed' }).where(eq(analysisReports.id, id))
    return Response.json({ error: 'AI API key required. Configure it in Settings.' }, { status: 401 })
  }
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as import('@/app/lib/aiConfig').AIProvider
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  try {
    const body = await request.json()
    const { applicationIds } = body as { applicationIds: string[] }

    const jobRecords = []

    for (const appId of applicationIds) {
      // Get JDText for this application, including any existing extraction
      const jdText = await db.query.jobDescriptionTexts.findFirst({
        where: and(
          eq(jobDescriptionTexts.userId, session.userId),
          eq(jobDescriptionTexts.applicationId, appId),
        ),
        with: { jobDescription: true },
      })

      if (!jdText) continue

      let jd = jdText.jobDescription

      if (!jd) {
        // Auto-extract — application has JD text but no structured extraction yet
        const extracted = await extractJobDescription(jdText.text, apiKey, provider, modelId, reasoning)

        // Guard against race condition (double-submit)
        const existing = await db.query.jobDescriptions.findFirst({
          where: eq(jobDescriptions.jobTextId, jdText.id),
        })

        if (existing) {
          jd = existing
        } else {
          const [created] = await db
            .insert(jobDescriptions)
            .values({
              jobTextId:             jdText.id,
              company:               extracted.company               ?? null,
              role:                  extracted.role                  ?? null,
              level:                 extracted.level                 ?? null,
              location:              extracted.location              ?? null,
              employmentType:        extracted.employment_type       ?? null,
              salaryEurMin:          extracted.salary_eur_min        ?? null,
              salaryEurMax:          extracted.salary_eur_max        ?? null,
              bonusPercent:          extracted.bonus_percent         ?? null,
              yearsExperienceMin:    extracted.years_experience_min  ?? null,
              yearsExperienceMax:    extracted.years_experience_max  ?? null,
              educationRequired:     extracted.education_required    ?? null,
              benefits:              extracted.benefits              ?? [],
              responsibilities:      extracted.responsibilities      ?? [],
              requiredCoreSkills:    extracted.required_core_skills  ?? [],
              desirableSkills:       extracted.desirable_skills      ?? [],
              programmingLanguages:  extracted.programming_languages ?? [],
              frameworksTools:       extracted.frameworks_tools      ?? [],
              databases:             extracted.databases             ?? [],
              cloudPlatforms:        extracted.cloud_platforms       ?? [],
              apiProtocols:          extracted.api_protocols         ?? [],
              methodologies:         extracted.methodologies         ?? [],
              mobileTechnologies:    extracted.mobile_technologies   ?? [],
              domainKeywords:        extracted.domain_keywords       ?? [],
              languageRequirements:  extracted.language_requirements ?? [],
              remoteWork:            extracted.remote_work           ?? null,
              workPermitRequired:    extracted.work_permit_required  ?? null,
              visaSponsorship:       extracted.visa_sponsorship      ?? null,
              contactPerson:         extracted.contact_person        ?? null,
              contactEmailOrPhone:   extracted.contact_email_or_phone ?? null,
              industry:              extracted.industry              ?? null,
            })
            .returning()
          jd = created
        }
      }

      jobRecords.push(mapJDToRecord(jd))
    }

    if (!jobRecords.length) {
      await db
        .update(analysisReports)
        .set({ status: 'failed' })
        .where(eq(analysisReports.id, id))
      return Response.json(
        { error: 'No JD data found — add job descriptions to the selected applications first' },
        { status: 422 },
      )
    }

    const analyst = new Analyst(jobRecords)
    const analysisData = analyst.analyze()

    await db.insert(analysisResults).values(
      Object.entries(analysisData).map(([name, result]) => ({
        reportId: id,
        name,
        result: result as Record<string, unknown>,
      })),
    )

    await db
      .update(analysisReports)
      .set({ status: 'done' })
      .where(eq(analysisReports.id, id))

    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('[POST /api/reports/:id/process]', err)
    await db
      .update(analysisReports)
      .set({ status: 'failed' })
      .where(eq(analysisReports.id, id))
    return Response.json({ error: 'Processing failed' }, { status: 500 })
  }
}
