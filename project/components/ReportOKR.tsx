'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { OKRContent } from '@/app/lib/ai/okr'

interface OKRRecord {
  id: string
  applicationId: string
  language: string
  content: OKRContent
  createdAt: string
}

interface AppOKREntry {
  applicationId: string
  company: string
  jobTitle: string
  role: string | null
  level: string | null
  hasJD: boolean
  okr: OKRRecord | null
}

const TIMEFRAME_COLORS: Record<string, string> = {
  '30': 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20',
  '90': 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20',
  '6': 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20',
}

const TIMEFRAME_LABEL_COLORS: Record<string, string> = {
  '30': 'text-sky-700 dark:text-sky-400',
  '90': 'text-indigo-700 dark:text-indigo-400',
  '6': 'text-violet-700 dark:text-violet-400',
}

function timeframeKey(tf: string): string {
  if (tf.includes('30')) return '30'
  if (tf.includes('90')) return '90'
  return '6'
}

function OKRCard({ entry, onGenerate }: {
  entry: AppOKREntry
  onGenerate: (applicationId: string) => Promise<void>
}) {
  const { t } = useLocale()
  const [generating, setGenerating] = useState(false)
  const [lang, setLang] = useState<'en' | 'zh'>('en')
  const [err, setErr] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const okr = entry.okr

  const handleGenerate = async () => {
    setErr(null)
    setGenerating(true)
    try {
      await onGenerate(entry.applicationId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{entry.company}</p>
            {entry.level && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 shrink-0">
                {entry.level}
              </span>
            )}
            {okr && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                OKR ready
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{entry.jobTitle}</p>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-400 shrink-0 ml-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-700/60 pt-4 space-y-4">
          {!entry.hasJD && !okr && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              No extracted JD — OKR will be generated from the job title and company name only. Add a JD for better results.
            </p>
          )}

          {!okr && (
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {(['en', 'zh'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      lang === l
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                    {l === 'en' ? t('english') : t('chinese')}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {generating && <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {generating ? t('loading') : t('generateOKR')}
              </button>
            </div>
          )}

          {err && <p className="text-xs text-red-500 dark:text-red-400">{err}</p>}

          {okr && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {t('generatedAt')} {new Date(okr.createdAt).toLocaleDateString('en-CA')} · {okr.language === 'zh' ? t('chinese') : t('english')}
                </p>
              </div>

              {/* Objectives */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {okr.content.objectives.map((obj) => {
                  const key = timeframeKey(obj.timeframe)
                  return (
                    <div key={obj.timeframe}
                      className={`rounded-lg border p-4 space-y-3 ${TIMEFRAME_COLORS[key]}`}>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${TIMEFRAME_LABEL_COLORS[key]}`}>
                          {obj.timeframe}
                        </p>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1 leading-snug">
                          {obj.objective}
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {obj.keyResults.map((kr, i) => (
                          <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className={`font-bold shrink-0 ${TIMEFRAME_LABEL_COLORS[key]}`}>KR{i + 1}</span>
                            <span>{kr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>

              {/* Interview prep */}
              {okr.content.interviewPrepTips?.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15 p-4">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                    {t('interviewPrepTips')}
                  </p>
                  <ul className="space-y-1.5">
                    {okr.content.interviewPrepTips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="text-amber-500 dark:text-amber-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportOKR({ reportId }: { reportId: string }) {
  const { t } = useLocale()
  const [lang, setLang] = useState<'en' | 'zh'>('en')

  const { data, mutate, isLoading } = useSWR<AppOKREntry[]>(
    `/api/reports/${reportId}/okrs`,
    (url: string) => fetch(url).then(r => r.ok ? r.json() : null),
    { revalidateOnFocus: false },
  )

  const entries = data ?? []

  const handleGenerate = useCallback(async (applicationId: string) => {
    const cfg = getAIConfig()
    if (!cfg?.apiKey) throw new Error('AI API key not configured. Go to Settings to add your key.')

    const res = await fetch(`/api/applications/${applicationId}/okr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Key': cfg.apiKey,
        'X-AI-Provider': cfg.provider,
        'X-AI-Model': cfg.model,
        'X-AI-Reasoning': String(cfg.reasoning),
      },
      body: JSON.stringify({ language: lang }),
    })

    if (!res.ok) {
      const bd = await res.json().catch(() => ({}))
      throw new Error((bd as { error?: string }).error ?? res.statusText)
    }

    await mutate()
  }, [lang, mutate])

  const generateAll = async () => {
    const missing = entries.filter(e => !e.okr)
    for (const entry of missing) {
      await handleGenerate(entry.applicationId)
    }
  }

  const generatedCount = entries.filter(e => e.okr).length

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!entries.length) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">
        No applications in this report. Create a new report and select applications.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {generatedCount}/{entries.length} {t('okrGenerated')}
          </p>
          <div className="flex gap-1.5">
            {(['en', 'zh'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  lang === l
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}>
                {l === 'en' ? t('english') : t('chinese')}
              </button>
            ))}
          </div>
        </div>
        {entries.some(e => !e.okr) && (
          <button
            onClick={generateAll}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            {t('generateAllOKRs')}
          </button>
        )}
      </div>

      {entries.map(entry => (
        <OKRCard
          key={entry.applicationId}
          entry={entry}
          onGenerate={(id) => handleGenerate(id)}
        />
      ))}
    </div>
  )
}
