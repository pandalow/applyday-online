'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { OKRContent } from '@/app/lib/ai/okr'
import { card, sectionLabel } from '@/app/lib/styles'
import Button from '@/components/ui/Button'

interface OKRRecord {
  id: string
  applicationId: string
  language: string
  content: OKRContent
  createdAt: string
}

interface AppEntry {
  applicationId: string
  company: string
  jobTitle: string
  status: string
  role: string | null
  level: string | null
  hasJD: boolean
  okr: OKRRecord | null
}

const TIMEFRAME_COLORS: Record<string, string> = {
  '30': 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20',
  '90': 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20',
  '6':  'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20',
}
const TIMEFRAME_TEXT: Record<string, string> = {
  '30': 'text-sky-700 dark:text-sky-400',
  '90': 'text-indigo-700 dark:text-indigo-400',
  '6':  'text-violet-700 dark:text-violet-400',
}
const STATUS_COLORS: Record<string, string> = {
  prepared:   'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400',
  applied:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  interviewed:'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  offered:    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  rejected:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

function tfKey(tf: string): string {
  if (tf.includes('30')) return '30'
  if (tf.includes('90')) return '90'
  return '6'
}

function OKRCard({ entry, lang, onGenerate, defaultExpanded = false }: {
  entry: AppEntry
  lang: 'en' | 'zh'
  onGenerate: (id: string, lang: 'en' | 'zh') => Promise<void>
  defaultExpanded?: boolean
}) {
  const { t } = useLocale()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [generating, setGenerating] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const okr = entry.okr

  const handleGenerate = async () => {
    setErr(null)
    setGenerating(true)
    try {
      await onGenerate(entry.applicationId, lang)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className={`${card} overflow-hidden`}>
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{entry.company}</p>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_COLORS[entry.status] ?? STATUS_COLORS.prepared}`}>
                {entry.status}
              </span>
              {entry.level && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 shrink-0">
                  {entry.level}
                </span>
              )}
              {okr ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                  ✓ OKR ready
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 shrink-0">
                  No OKR
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{entry.jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-700/60 pt-4 space-y-4">
          {err && <p className="text-xs text-red-500">{err}</p>}

          {!entry.hasJD && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t('okrRequiresJD')}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{t('okrRequiresJDDesc')}</p>
              </div>
            </div>
          )}

          {!okr && entry.hasJD && !generating && (
            <Button onClick={handleGenerate}>{t('generateOKR')}</Button>
          )}

          {okr && (
            <div className="space-y-4">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {t('generatedAt')} {new Date(okr.createdAt).toLocaleDateString('en-CA')} · {okr.language === 'zh' ? t('chinese') : t('english')}
              </p>

              {/* 3-column OKR grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {okr.content.objectives.map(obj => {
                  const k = tfKey(obj.timeframe)
                  return (
                    <div key={obj.timeframe} className={`rounded-lg border p-4 space-y-3 ${TIMEFRAME_COLORS[k]}`}>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${TIMEFRAME_TEXT[k]}`}>{obj.timeframe}</p>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1 leading-snug">{obj.objective}</p>
                      </div>
                      <ul className="space-y-1.5">
                        {obj.keyResults.map((kr, i) => (
                          <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className={`font-bold shrink-0 ${TIMEFRAME_TEXT[k]}`}>KR{i + 1}</span>
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
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5">
                    {t('interviewPrepTips')}
                  </p>
                  <ul className="space-y-2">
                    {okr.content.interviewPrepTips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regenerate */}
              <Button variant="secondary" onClick={handleGenerate} loading={generating}>
                {generating ? t('loading') : 'Regenerate'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  applicationId?: string
}

export default function InsightOKR({ applicationId }: Props = {}) {
  const { t } = useLocale()
  const [lang, setLang] = useState<'en' | 'zh'>('en')
  const [filter, setFilter] = useState<'all' | 'missing' | 'done'>('all')
  const [aiConfigured, setAiConfigured] = useState(true)

  useEffect(() => {
    setAiConfigured(!!getAIConfig()?.apiKey)
  }, [])

  const { data, mutate, isLoading } = useSWR<AppEntry[]>(
    '/api/okrs',
    (url: string) => fetch(url).then(r => r.ok ? r.json() : null),
    { revalidateOnFocus: false },
  )

  const allEntries = data ?? []
  const entries = applicationId ? allEntries.filter(e => e.applicationId === applicationId) : allEntries
  const filtered = entries.filter(e =>
    filter === 'all' ? true : filter === 'done' ? !!e.okr : !e.okr
  )
  const generatedCount = entries.filter(e => e.okr).length

  const handleGenerate = useCallback(async (applicationId: string, l: 'en' | 'zh') => {
    const cfg = getAIConfig()
    if (!cfg?.apiKey) throw new Error('AI API key not configured. Go to Settings.')

    const res = await fetch(`/api/applications/${applicationId}/okr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Key': cfg.apiKey,
        'X-AI-Provider': cfg.provider,
        'X-AI-Model': cfg.model,
        'X-AI-Reasoning': String(cfg.reasoning),
      },
      body: JSON.stringify({ language: l }),
    })
    if (!res.ok) {
      const bd = await res.json().catch(() => ({}))
      throw new Error((bd as { error?: string }).error ?? res.statusText)
    }
    await mutate()
  }, [mutate])

  const generateAllMissing = async () => {
    for (const entry of entries.filter(e => !e.okr && e.hasJD)) {
      await handleGenerate(entry.applicationId, lang).catch(() => null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!entries.length) {
    return (
      <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
        <p className="text-sm">No applications yet. Add some to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          <a href="/settings" className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 underline hover:no-underline">
            {t('goToSettings')}
          </a>
        </div>
      )}

      {/* Toolbar — hidden in single-app workspace mode */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${applicationId ? 'hidden' : ''}`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Progress */}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {generatedCount} / {entries.length} {t('okrGenerated')}
          </span>

          {/* Filter */}
          <div className="flex gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
            {(['all', 'missing', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 transition-colors capitalize ${
                  filter === f
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* Language */}
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

        {entries.some(e => !e.okr && e.hasJD) && (
          <Button onClick={generateAllMissing}>{t('generateAllOKRs')}</Button>
        )}
      </div>

      {/* Application list */}
      <div className="space-y-2">
        {filtered.map(entry => (
          <OKRCard
            key={entry.applicationId}
            entry={entry}
            lang={lang}
            onGenerate={handleGenerate}
            defaultExpanded={!!applicationId}
          />
        ))}
        {!filtered.length && (
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-8">No applications match this filter.</p>
        )}
      </div>
    </div>
  )
}
