import { db } from '@/app/lib/drizzle'
import {
  generationJobs,
  jobInsights,
  applicationOkrs,
  resumeSuggestions,
  coverLetters,
  jobDescriptionTexts,
  resumeTexts,
  applications,
} from '@/app/db/schema'
import type { SuggestionItem } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateJobInsight } from '@/app/lib/ai/jobInsight'
import { generateOKR } from '@/app/lib/ai/okr'
import { generateResumeSuggestions } from '@/app/lib/ai/resumeSuggestions'
import { generateCoverLetter } from '@/app/lib/ai/coverLetter'
import type { AIProvider } from '@/app/lib/aiConfig'

type Job = typeof generationJobs.$inferSelect

async function runJob(job: Job): Promise<void> {
  const { applicationId, userId, type, resumeId, apiKey, provider, model, reasoning } = job
  const prov = provider as AIProvider

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  })
  if (!app) throw new Error('Application not found')

  const jdRow = await db.query.jobDescriptionTexts.findFirst({
    where: and(eq(jobDescriptionTexts.applicationId, applicationId), eq(jobDescriptionTexts.userId, userId)),
    with: { jobDescription: true },
  })
  if (!jdRow) throw new Error('No job description found. Please paste and save the JD first.')

  let resume = null
  if (resumeId) {
    resume = await db.query.resumeTexts.findFirst({
      where: and(eq(resumeTexts.id, resumeId), eq(resumeTexts.userId, userId)),
    })
  }

  if (type === 'insight') {
    const content = await generateJobInsight(
      jdRow.text,
      resume ? { text: resume.text } : null,
      apiKey, prov, model, reasoning,
    )
    await db.delete(jobInsights).where(
      and(eq(jobInsights.applicationId, applicationId), eq(jobInsights.userId, userId)),
    )
    await db.insert(jobInsights).values({ applicationId, userId, resumeId: resume?.id ?? null, content })
    return
  }

  // Structured JD is optional — fall back to app record fields when not extracted yet
  const jd = jdRow.jobDescription

  if (type === 'resume') {
    if (!resume) throw new Error('Resume required for resume suggestions.')
    const generated = await generateResumeSuggestions(
      { text: resume.text },
      {
        role: jd?.role ?? app.jobTitle,
        company: jd?.company ?? app.company,
        requiredCoreSkills: (jd?.requiredCoreSkills ?? []) as string[],
        desirableSkills: (jd?.desirableSkills ?? []) as string[],
        frameworksTools: (jd?.frameworksTools ?? []) as string[],
        responsibilities: (jd?.responsibilities ?? []) as string[],
        domainKeywords: (jd?.domainKeywords ?? []) as string[],
      },
      apiKey, prov, model, reasoning,
    )
    const suggestions: SuggestionItem[] = generated.map(s => ({ ...s, status: 'pending' as const }))
    await db.delete(resumeSuggestions).where(
      and(
        eq(resumeSuggestions.applicationId, applicationId),
        eq(resumeSuggestions.resumeId, resumeId!),
        eq(resumeSuggestions.userId, userId),
      ),
    )
    await db.insert(resumeSuggestions).values({ applicationId, resumeId: resumeId!, userId, suggestions })
    return
  }

  if (type === 'cover') {
    if (!resume) throw new Error('Resume required for cover letter.')
    const content = await generateCoverLetter(
      { text: resume.text },
      {
        company: jd?.company ?? app.company,
        role: jd?.role ?? app.jobTitle,
        requiredCoreSkills: (jd?.requiredCoreSkills ?? []) as string[],
        responsibilities: (jd?.responsibilities ?? []) as string[],
        desirableSkills: (jd?.desirableSkills ?? []) as string[],
        frameworksTools: (jd?.frameworksTools ?? []) as string[],
      },
      'professional',
      apiKey, prov, model, reasoning,
    )
    await db.delete(coverLetters).where(
      and(
        eq(coverLetters.applicationId, applicationId),
        eq(coverLetters.resumeId, resumeId!),
        eq(coverLetters.userId, userId),
      ),
    )
    await db.insert(coverLetters).values({ applicationId, resumeId: resumeId!, userId, tone: 'professional', content })
    return
  }

  if (type === 'okr') {
    const content = await generateOKR(
      {
        role: jd?.role ?? app.jobTitle,
        company: jd?.company ?? app.company,
        level: jd?.level ?? null,
        industry: jd?.industry ?? null,
        location: jd?.location ?? null,
        employment_type: jd?.employmentType ?? null,
        responsibilities: (jd?.responsibilities ?? []) as string[],
        required_core_skills: (jd?.requiredCoreSkills ?? []) as string[],
        desirable_skills: (jd?.desirableSkills ?? []) as string[],
        frameworks_tools: (jd?.frameworksTools ?? []) as string[],
        domain_keywords: (jd?.domainKeywords ?? []) as string[],
      },
      'en',
      apiKey, prov, model, reasoning,
    )
    await db.insert(applicationOkrs).values({ applicationId, userId, language: 'en', content })
    return
  }

  throw new Error(`Unknown job type: ${type}`)
}

export async function processGenerationJobs(jobIds: string[]): Promise<void> {
  for (const jobId of jobIds) {
    const job = await db.query.generationJobs.findFirst({
      where: eq(generationJobs.id, jobId),
    })
    if (!job || job.status !== 'pending') continue

    await db.update(generationJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(generationJobs.id, jobId))

    try {
      await runJob(job)
      await db.update(generationJobs)
        .set({ status: 'done', completedAt: new Date() })
        .where(eq(generationJobs.id, jobId))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[generateAllWorker] job ${jobId} (${job.type}) failed:`, message)
      await db.update(generationJobs)
        .set({ status: 'error', error: message, completedAt: new Date() })
        .where(eq(generationJobs.id, jobId))
    }
  }
}
