import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { jobDescriptions, jobDescriptionTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { extractJobDescription } from '@/app/lib/ai/extract'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await verifySession()
  const apiKey = request.headers.get('X-AI-Key') ?? request.headers.get('X-OpenAI-Key')
  if (!apiKey) {
    return Response.json({ error: 'AI API key required. Configure it in Settings.' }, { status: 401 })
  }
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as import('@/app/lib/aiConfig').AIProvider
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  try {
    const body = await request.json()
    const { jobTextId } = body

    if (!jobTextId) {
      return Response.json({ error: 'jobTextId is required' }, { status: 400 })
    }

    // Fetch the JDT and verify ownership
    const jdt = await db.query.jobDescriptionTexts.findFirst({
      where: eq(jobDescriptionTexts.id, jobTextId),
    })

    if (!jdt || jdt.userId !== session.userId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // Check if a JD already exists for this JDT
    const existingJD = await db.query.jobDescriptions.findFirst({
      where: eq(jobDescriptions.jobTextId, jobTextId),
    })

    if (existingJD) {
      // Delete the old one so we can re-extract
      await db.delete(jobDescriptions).where(eq(jobDescriptions.id, existingJD.id))
    }

    // Call AI extraction
    const extracted = await extractJobDescription(jdt.text, apiKey, provider, modelId, reasoning)

    // Map snake_case ExtractedJD -> camelCase DB schema
    const [created] = await db
      .insert(jobDescriptions)
      .values({
        jobTextId,
        company:               extracted.company   ?? null,
        role:                  extracted.role       ?? null,
        level:                 extracted.level      ?? null,
        location:              extracted.location   ?? null,
        employmentType:        extracted.employment_type      ?? null,
        salaryEurMin:          extracted.salary_eur_min       ?? null,
        salaryEurMax:          extracted.salary_eur_max       ?? null,
        bonusPercent:          extracted.bonus_percent        ?? null,
        yearsExperienceMin:    extracted.years_experience_min ?? null,
        yearsExperienceMax:    extracted.years_experience_max ?? null,
        educationRequired:     extracted.education_required   ?? null,
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

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[POST /api/jd/extract]', err)
    return Response.json({ error: 'Failed to extract job description' }, { status: 500 })
  }
}
