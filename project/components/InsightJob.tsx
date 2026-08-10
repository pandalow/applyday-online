'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import useSWR from 'swr'
import { getAIConfig } from '@/app/lib/aiConfig'
import { useLocale } from '@/locales'
import type { JobInsightContent } from '@/app/db/schema'
import { card, cardHeader, sectionLabel, inputBase } from '@/app/lib/styles'
import Button from '@/components/ui/Button'
import JobInsightView, { exportToMarkdown } from '@/components/JobInsightView'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

interface Props {
  applicationId: string
  company: string
  jobTitle: string
}

interface ResumeEntry {
  id: string
  name: string
}

interface InsightRow {
  id: string
  content: JobInsightContent
  resumeId: string | null
  createdAt: string
}

type BgStatus = 'pending' | 'running' | 'done' | 'error'
interface BgJob {
  id: string
  type: 'okr' | 'resume' | 'cover'
  status: BgStatus
  error: string | null
  resumeId: string | null
}

const BG_LABELS: Record<string, string> = {
  okr:    'OKR Prep',
  resume: 'Resume Suggestions',
  cover:  'Cover Letter',
}

function BgStatusIcon({ status }: { status: BgStatus }) {
  if (status === 'pending') return <span className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />
  if (status === 'running') return <span className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
  if (status === 'done')    return (
    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
  return (
    <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  )
}

const POLL_INTERVAL = 3000

export default function InsightJob({ applicationId, company, jobTitle }: Props) {
  const { t, lang } = useLocale()
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiConfigured, setAiConfigured] = useState(true)

  // "Also generate" state
  const [generateAll, setGenerateAll] = useState(false)
  const [bgJobs, setBgJobs] = useState<BgJob[]>([])
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setAiConfigured(!!getAIConfig()?.apiKey) }, [])

  const { data: resumes = [] } = useSWR<ResumeEntry[]>('/api/resumes', fetcher)
  const { data: row, mutate } = useSWR<InsightRow | null>(
    `/api/applications/${applicationId}/job-insight`,
    fetcher,
  )
  const content = row?.content ?? null

  // Background jobs (okr/resume/cover only)
  const fetchBgJobs = useCallback(async (): Promise<BgJob[]> => {
    const res = await fetch(`/api/applications/${applicationId}/generate-all`)
    if (!res.ok) return []
    const all = await res.json() as Array<{ id: string; type: string; status: BgStatus; error: string | null; resumeId: string | null }>
    return all.filter(j => j.type === 'okr' || j.type === 'resume' || j.type === 'cover') as BgJob[]
  }, [applicationId])

  const isActive = (j: BgJob) => j.status === 'pending' || j.status === 'running'

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    const tick = async () => {
      const jobs = await fetchBgJobs()
      setBgJobs(jobs)
      if (jobs.some(isActive)) {
        pollRef.current = setTimeout(tick, POLL_INTERVAL)
      } else {
        pollRef.current = null
      }
    }
    pollRef.current = setTimeout(tick, POLL_INTERVAL)
  }, [fetchBgJobs])

  useEffect(() => {
    fetchBgJobs().then(jobs => { if (jobs.length) setBgJobs(jobs) })
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [fetchBgJobs])

  const generate = async () => {
    const cfg = getAIConfig()
    if (!cfg?.apiKey) { setError(t('aiKeyRequiredDesc')); return }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/job-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({ resumeId: selectedResumeId || undefined, language: lang }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      await mutate()

      // Kick off background jobs for extras if requested
      if (generateAll) {
        const extraTypes = selectedResumeId ? ['okr', 'resume', 'cover'] : ['okr']
        const bgRes = await fetch(`/api/applications/${applicationId}/generate-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AI-Key': cfg.apiKey,
            'X-AI-Provider': cfg.provider,
            'X-AI-Model': cfg.model,
            'X-AI-Reasoning': String(cfg.reasoning),
          },
          body: JSON.stringify({
            resumeId: selectedResumeId || undefined,
            types: extraTypes,
          }),
        })
        if (bgRes.ok) {
          const fresh = await fetchBgJobs()
          setBgJobs(fresh)
          startPolling()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    if (!content) return
    const md = exportToMarkdown(content, company, jobTitle)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${company}_${jobTitle}_insight.md`.replace(/\s+/g, '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  const bgRunning = bgJobs.some(isActive)
  const bgRelevant = bgJobs.filter(j => j.resumeId === (selectedResumeId || null) || j.type === 'okr')

  const generateLabel = (() => {
    const base = content ? t('jobInsightRegenerate') : t('jobInsightGenerate')
    if (!generateAll) return base
    const extras = selectedResumeId ? '+ OKR, Resume, Cover' : '+ OKR'
    return `${base} ${extras}`
  })()

  return (
    <div className="space-y-6">
      {/* AI key warning */}
      {!aiConfigured && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('aiKeyRequired')}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{t('aiKeyRequiredDesc')}</p>
            </div>
          </div>
          <a href="/settings" className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 underline hover:no-underline">{t('goToSettings')}</a>
        </div>
      )}

      {/* Controls */}
      <div className={`${card} p-4 space-y-4`}>
        {/* Resume selector */}
        <div className="space-y-1.5">
          <label className={sectionLabel}>
            {t('jobInsightSelectResume')} <span className="font-normal normal-case">{t('optional')}</span>
          </label>
          <select
            value={selectedResumeId}
            onChange={e => setSelectedResumeId(e.target.value)}
            className={inputBase}
          >
            <option value="">{t('jobInsightNoResume')}</option>
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Also generate toggle */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={generateAll}
            onChange={e => setGenerateAll(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-indigo-600 cursor-pointer"
          />
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              Also generate OKR, Resume Suggestions &amp; Cover Letter
            </p>
            {generateAll && !selectedResumeId && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                Resume Suggestions and Cover Letter require a resume — only OKR will be generated.
              </p>
            )}
          </div>
        </label>

        <div className="flex items-center gap-3">
          <Button onClick={generate} loading={generating}>
            {generating ? t('generating') : generateLabel}
          </Button>

          {content && (
            <Button variant="secondary" onClick={handleExport}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('exportMd')}
            </Button>
          )}

          {row && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {t('generatedAt')} {new Date(row.createdAt).toLocaleDateString('en-CA')}
              {row.resumeId ? ` · ${t('withResume')}` : ''}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Background jobs progress */}
      {bgJobs.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <div className={`${cardHeader} flex items-center justify-between`}>
            <h3 className={sectionLabel}>Background Generation</h3>
            {bgRunning && <span className="text-xs text-indigo-500 dark:text-indigo-400">Running…</span>}
            {!bgRunning && <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {bgJobs.filter(j => j.status === 'done').length} / {bgJobs.length} complete
            </span>}
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {bgRelevant.map(job => (
              <div key={job.id} className="flex items-center gap-2.5">
                <BgStatusIcon status={job.status} />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${
                    job.status === 'done'    ? 'text-emerald-700 dark:text-emerald-400' :
                    job.status === 'error'   ? 'text-red-600 dark:text-red-400' :
                    job.status === 'running' ? 'text-indigo-600 dark:text-indigo-400' :
                    'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {BG_LABELS[job.type]}
                  </span>
                  {job.error && <p className="text-xs text-red-500 mt-0.5 truncate">{job.error}</p>}
                </div>
                {job.status === 'done' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Done</span>
                )}
              </div>
            ))}
          </div>
          {!bgRunning && bgJobs.some(j => j.status === 'done') && (
            <div className="px-4 pb-3">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Switch to each tab to view the results.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {generating && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${card} p-5 animate-pulse`}>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mb-4" />
              <div className="space-y-2">
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!generating && content && <JobInsightView content={content} company={company} jobTitle={jobTitle} />}

      {/* Empty state */}
      {!generating && !content && (
        <div className="text-center py-12 text-sm text-zinc-400 dark:text-zinc-600">
          {t('jobInsightEmpty')}
        </div>
      )}
    </div>
  )
}
