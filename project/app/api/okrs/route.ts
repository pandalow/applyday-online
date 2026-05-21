import { db } from '@/app/lib/drizzle'
import {
  applications, applicationOkrs, jobDescriptionTexts,
} from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  const [apps, jdTexts, okrs] = await Promise.all([
    db.query.applications.findMany({
      where: eq(applications.userId, session.userId),
      orderBy: [desc(applications.applicationDate)],
    }),
    db.query.jobDescriptionTexts.findMany({
      where: eq(jobDescriptionTexts.userId, session.userId),
      with: { jobDescription: true },
    }),
    db.query.applicationOkrs.findMany({
      where: eq(applicationOkrs.userId, session.userId),
      orderBy: [desc(applicationOkrs.createdAt)],
    }),
  ])

  const jdByApp = new Map(jdTexts.map(t => [t.applicationId, t.jobDescription]))
  const okrByApp = new Map<string, typeof okrs[number]>()
  for (const okr of okrs) {
    if (!okrByApp.has(okr.applicationId)) okrByApp.set(okr.applicationId, okr)
  }

  const result = apps.map(app => {
    const jd = jdByApp.get(app.id)
    return {
      applicationId: app.id,
      company: app.company,
      jobTitle: app.jobTitle,
      status: app.status,
      role: jd?.role ?? null,
      level: jd?.level ?? null,
      hasJD: !!jd,
      okr: okrByApp.get(app.id) ?? null,
    }
  })

  return Response.json(result)
}
