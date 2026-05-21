import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import {
  analysisReports, applications, applicationOkrs,
  jobDescriptionTexts, jobDescriptions,
} from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and, inArray, desc } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const report = await db.query.analysisReports.findFirst({
    where: and(eq(analysisReports.id, id), eq(analysisReports.userId, session.userId)),
  })
  if (!report) return Response.json({ error: 'Not found' }, { status: 404 })

  const appIds = report.applicationIds ?? []
  if (!appIds.length) return Response.json([])

  const [apps, jdTexts, okrs] = await Promise.all([
    db.query.applications.findMany({
      where: and(
        inArray(applications.id, appIds),
        eq(applications.userId, session.userId),
      ),
    }),
    db.query.jobDescriptionTexts.findMany({
      where: and(
        inArray(jobDescriptionTexts.applicationId, appIds),
        eq(jobDescriptionTexts.userId, session.userId),
      ),
      with: { jobDescription: true },
    }),
    db.query.applicationOkrs.findMany({
      where: and(
        inArray(applicationOkrs.applicationId, appIds),
        eq(applicationOkrs.userId, session.userId),
      ),
      orderBy: [desc(applicationOkrs.createdAt)],
    }),
  ])

  const jdByApp = new Map(jdTexts.map(t => [t.applicationId, t.jobDescription]))
  const okrByApp = new Map<string, typeof okrs[number]>()
  for (const okr of okrs) {
    if (!okrByApp.has(okr.applicationId)) okrByApp.set(okr.applicationId, okr)
  }

  const result = appIds.map(appId => {
    const app = apps.find(a => a.id === appId)
    const jd = jdByApp.get(appId)
    const okr = okrByApp.get(appId)
    return {
      applicationId: appId,
      company: app?.company ?? jd?.company ?? '—',
      jobTitle: app?.jobTitle ?? jd?.role ?? '—',
      role: jd?.role ?? null,
      level: jd?.level ?? null,
      hasJD: !!jd,
      okr: okr ?? null,
    }
  })

  return Response.json(result)
}
