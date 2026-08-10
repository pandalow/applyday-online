'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/locales'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { Application, JDText } from '@/components/types'
import ResumeManager from '@/components/ResumeManager'

interface ReportGeneratorProps {
  onSuccess: (reportId: string) => void
}

type JDStatus = { hasText: boolean; hasExtraction: boolean }

export default function ReportGenerator({ onSuccess }: ReportGeneratorProps) {
  const { t } = useLocale()
  const [apps, setApps] = useState<Application[]>([])
  const [jdMap, setJdMap] = useState<Map<string, JDStatus>>(new Map())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/applications').then(r => r.ok ? r.json() : []),
      fetch('/api/extract').then(r => r.ok ? r.json() : []),
    ]).then(([appList, jdTexts]: [Application[], JDText[]]) => {
      setApps(appList)

      const map = new Map<string, JDStatus>()
      for (const jdt of jdTexts) {
        if (jdt.applicationId) {
          map.set(jdt.applicationId, {
            hasText: true,
            hasExtraction: !!jdt.jobDescription,
          })
        }
      }
      setJdMap(map)

      // Auto-select all apps that have JD text
      setSelectedIds(new Set(
        appList.filter(a => map.has(a.id)).map(a => a.id)
      ))
    })
  }, [])

  const appsWithJD  = apps.filter(a => jdMap.has(a.id))
  const allSelected = appsWithJD.length > 0 && appsWithJD.every(a => selectedIds.has(a.id))

  const toggleAll = () => {
    setSelectedIds(allSelected
      ? new Set()
      : new Set(appsWithJD.map(a => a.id))
    )
  }

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedIds.size) {
      setError('Select at least one application.')
      return
    }
    const cfg = getAIConfig()
    if (!cfg?.apiKey) {
      setError('AI API key not configured. Go to Settings to add your key.')
      return
    }
    setSubmitting(true)
    try {
      const applicationIds = [...selectedIds]

      // Create pending report
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds }),
      })
      if (!res.ok) {
        const bd = await res.json().catch(() => ({}))
        throw new Error((bd as { error?: string }).error ?? res.statusText)
      }
      const report = await res.json() as { id: string }

      // Fire background processing — don't await
      fetch(`/api/reports/${report.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({ applicationIds }),
      }).catch(err => console.error('[process]', err))

      onSuccess(report.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Application selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Applications ({selectedIds.size} selected)
          </label>
          {appsWithJD.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-900">
          {apps.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-3">{t('noData')}</p>
          ) : (
            apps.map(app => {
              const status = jdMap.get(app.id)
              const canSelect = !!status
              return (
                <label
                  key={app.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                    canSelect
                      ? 'cursor-pointer hover:bg-white dark:hover:bg-zinc-800'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => canSelect && toggle(app.id)}
                    disabled={!canSelect}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 disabled:opacity-50"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium truncate block">
                      {app.company}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate block">
                      {app.jobTitle}
                    </span>
                  </span>
                  {/* JD status indicator */}
                  {status?.hasExtraction ? (
                    <span className="shrink-0 text-xs text-green-600 dark:text-green-400 font-medium" title="Extraction ready">
                      ✓ ready
                    </span>
                  ) : status?.hasText ? (
                    <span className="shrink-0 text-xs text-yellow-600 dark:text-yellow-400 font-medium" title="Will auto-extract on generate">
                      ⚡ extract
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500" title="No JD text — paste in application detail">
                      no JD
                    </span>
                  )}
                </label>
              )
            })
          )}
        </div>

        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          ✓ ready = uses cached extraction · ⚡ extract = auto-extracts on generate (uses tokens) · no JD = skipped
        </p>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
          {t('language')}
        </label>
        <div className="flex gap-2">
          {(['en', 'zh'] as const).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                language === l
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {l === 'en' ? t('english') : t('chinese')}
            </button>
          ))}
        </div>
      </div>

      {/* Resume selector */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
          {t('resume')} ({selectedResumeId ? t('selectedResume') : t('none')})
        </label>
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900">
          <ResumeManager
            onSelectResume={id => setSelectedResumeId(prev => prev === id ? '' : id)}
            selectedResumeId={selectedResumeId}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !selectedIds.size}
        className="w-full py-2 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-40"
      >
        {submitting ? t('loading') : t('generateReport')}
      </button>
    </form>
  )
}
