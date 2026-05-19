'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/locales'
import type { JobDescription } from '@/components/types'
import ResumeManager from '@/components/ResumeManager'

interface ReportGeneratorProps {
  onSuccess: (reportId: string) => void
}

type Mode = 'all' | 'selected' | 'dateRange'

export default function ReportGenerator({ onSuccess }: ReportGeneratorProps) {
  const { t } = useLocale()
  const [mode, setMode] = useState<Mode>('all')
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jdList, setJdList] = useState<JobDescription[]>([])
  const [selectedJdIds, setSelectedJdIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'selected') {
      fetch('/api/jd')
        .then(r => (r.ok ? r.json() : []))
        .then((data: JobDescription[]) => setJdList(data))
        .catch(() => setJdList([]))
    }
  }, [mode])

  const toggleJd = (id: string) => {
    setSelectedJdIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {}
      if (mode === 'selected') {
        if (selectedJdIds.length === 0) throw new Error('Please select at least one job description.')
        body.jobIds = selectedJdIds
      } else if (mode === 'dateRange') {
        if (startDate) body.startAt = startDate
        if (endDate) body.endAt = endDate
      }
      // language + resume sent for insight generation (handled separately)
      // but pass them for forward compatibility
      body.language = language
      if (selectedResumeId) body.resumeId = selectedResumeId

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const bd = await res.json().catch(() => ({}))
        throw new Error((bd as { error?: string }).error ?? res.statusText)
      }
      const report = await res.json() as { id: string }
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

      {/* Mode selection */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
          {t('allApplications')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['all', 'selected', 'dateRange'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 rounded-md text-xs font-medium border transition-colors ${
                mode === m
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              {m === 'all' ? t('allApplications') : m === 'selected' ? t('selectedByIds') : t('dateRange')}
            </button>
          ))}
        </div>
      </div>

      {/* Selected JDs */}
      {mode === 'selected' && (
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
            {t('selectJDs')} ({selectedJdIds.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-900">
            {jdList.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-3">{t('noData')}</p>
            ) : (
              jdList.map(jd => (
                <label
                  key={jd.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedJdIds.includes(jd.id)}
                    onChange={() => toggleJd(jd.id)}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                    {jd.role ?? '(no role)'} — {jd.company ?? '(no company)'}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Date range */}
      {mode === 'dateRange' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('startDate')}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('endDate')}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}

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
          {t('resume')} ({t('none')})
        </label>
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900">
          <ResumeManager
            onSelectResume={id => setSelectedResumeId(prev => prev === id ? '' : id)}
            selectedResumeId={selectedResumeId}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
      >
        {submitting ? t('loading') : t('generateReport')}
      </button>
    </form>
  )
}
