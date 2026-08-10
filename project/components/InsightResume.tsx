'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import ResumeManager from '@/components/ResumeManager'
import { getAIConfig } from '@/app/lib/aiConfig'
import { useLocale } from '@/locales'
import type { SuggestionItem, SuggestionType } from '@/app/db/schema'
import { card, cardHeader, sectionLabel } from '@/app/lib/styles'
import Button from '@/components/ui/Button'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

interface Props {
  applicationId: string
}

interface SuggestionsRow {
  id: string
  suggestions: SuggestionItem[]
  resumeId: string
  createdAt: string
}

const TYPE_META: Record<SuggestionType, { label: string; color: string }> = {
  keyword_gap: { label: 'Keyword Gap', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  quantify:    { label: 'Quantify',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  reframe:     { label: 'Reframe',      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  add_section: { label: 'Add Section',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export default function InsightResume({ applicationId }: Props) {
  const { t, lang } = useLocale()
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [aiConfigured, setAiConfigured] = useState(true)

  useEffect(() => {
    setAiConfigured(!!getAIConfig()?.apiKey)
  }, [])

  const { data: row, mutate } = useSWR<SuggestionsRow | null>(
    selectedResumeId
      ? `/api/applications/${applicationId}/resume-suggestions?resumeId=${selectedResumeId}`
      : null,
    fetcher,
  )

  const suggestions: SuggestionItem[] = row?.suggestions ?? []
  const pending   = suggestions.filter(s => s.status === 'pending')
  const accepted  = suggestions.filter(s => s.status === 'accepted')
  const dismissed = suggestions.filter(s => s.status === 'dismissed')

  const generate = async () => {
    if (!selectedResumeId) return
    const cfg = getAIConfig()
    if (!cfg?.apiKey) { setError('AI API key not configured. Go to Settings.'); return }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/resume-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({ resumeId: selectedResumeId, language: lang }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const updateStatus = useCallback(async (suggestionId: string, status: SuggestionItem['status']) => {
    if (!selectedResumeId || !row) return
    const res = await fetch(`/api/applications/${applicationId}/resume-suggestions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: selectedResumeId, suggestionId, status }),
    })
    if (res.ok) mutate()
  }, [applicationId, selectedResumeId, row, mutate])

  const accept = useCallback(async (s: SuggestionItem) => {
    await navigator.clipboard.writeText(s.text)
    setCopied(s.id)
    setTimeout(() => setCopied(null), 2000)
    updateStatus(s.id, 'accepted')
  }, [updateStatus])

  const step1Done = !!selectedResumeId
  const canGenerate = step1Done

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
          <a href="/settings" className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 underline hover:no-underline">
            {t('goToSettings')}
          </a>
        </div>
      )}

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: t('stepUploadResume'), done: step1Done },
          { num: 2, label: t('stepGetSuggestions'), done: suggestions.length > 0 },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />}
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                step.done
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700'
              }`}>
                {step.done ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.num}
              </div>
              <span className={`text-xs font-medium ${
                step.done ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'
              }`}>{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Resume picker + generate */}
      <div className={`${card} p-4 space-y-4`}>
        <h3 className={`${sectionLabel} flex items-center gap-2`}>
          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
          {t('stepUploadResume')}
        </h3>
        <ResumeManager
          onSelectResume={setSelectedResumeId}
          selectedResumeId={selectedResumeId}
        />

        <Button
          onClick={generate}
          disabled={!canGenerate}
          loading={generating}
          className="w-full"
        >
          <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
          {generating ? 'Analysing…' : row ? 'Re-analyse' : t('stepGetSuggestions')}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
              {suggestions.length} suggestions
            </span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400">{accepted.length} accepted</span>
            <span>·</span>
            <span>{dismissed.length} dismissed</span>
            <span>·</span>
            <span className="text-indigo-600 dark:text-indigo-400">{pending.length} pending</span>
          </div>

          {pending.map(s => {
            const meta = TYPE_META[s.type]
            return (
              <div key={s.id} className={`${card} overflow-hidden`}>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.section}</span>
                  </div>

                  {s.original && (
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5">
                      <p className="text-xs text-zinc-400 mb-1">Current</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500 line-through leading-relaxed">{s.original}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Suggestion</p>
                    <p className="text-sm text-zinc-900 dark:text-white leading-relaxed">{s.text}</p>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{s.reason}</p>
                </div>

                <div className={`border-t border-zinc-100 dark:border-zinc-700 px-4 py-3 flex gap-2 bg-zinc-50/50 dark:bg-zinc-800/30`}>
                  <Button variant="success" onClick={() => accept(s)}>
                    {copied === s.id ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : 'Accept & Copy'}
                  </Button>
                  <Button variant="secondary" onClick={() => updateStatus(s.id, 'dismissed')}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )
          })}

          {accepted.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {accepted.length} accepted
              </summary>
              <div className="mt-3 space-y-2">
                {accepted.map(s => (
                  <div key={s.id} className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{s.section}</p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{s.text}</p>
                    </div>
                    <button
                      onClick={() => updateStatus(s.id, 'pending')}
                      className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      undo
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {pending.length === 0 && dismissed.length === 0 && accepted.length === suggestions.length && (
            <div className="text-center py-6 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              All suggestions accepted. Good luck with your application!
            </div>
          )}
        </div>
      )}

      {canGenerate && !generating && suggestions.length === 0 && (
        <div className="text-center py-10 text-sm text-zinc-500 dark:text-zinc-400">
          Click Analyse Resume to generate tailored suggestions.
        </div>
      )}
    </div>
  )
}
