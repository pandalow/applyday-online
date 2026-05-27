'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import ResumeManager from '@/components/ResumeManager'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { SuggestionItem, SuggestionType } from '@/app/db/schema'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

interface AppEntry {
  applicationId: string
  company: string
  jobTitle: string
  hasJD: boolean
  role: string | null
  level: string | null
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

export default function InsightResume() {
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: allApps = [] } = useSWR<AppEntry[]>('/api/okrs', fetcher)
  const appsWithJD = allApps.filter(a => a.hasJD)

  const { data: row, mutate } = useSWR<SuggestionsRow | null>(
    selectedAppId && selectedResumeId
      ? `/api/applications/${selectedAppId}/resume-suggestions?resumeId=${selectedResumeId}`
      : null,
    fetcher,
  )

  const suggestions: SuggestionItem[] = row?.suggestions ?? []
  const pending   = suggestions.filter(s => s.status === 'pending')
  const accepted  = suggestions.filter(s => s.status === 'accepted')
  const dismissed = suggestions.filter(s => s.status === 'dismissed')

  const generate = async () => {
    if (!selectedResumeId || !selectedAppId) return
    const cfg = getAIConfig()
    if (!cfg?.apiKey) { setError('AI API key not configured. Go to Settings.'); return }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/resume-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({ resumeId: selectedResumeId }),
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
    if (!selectedAppId || !selectedResumeId || !row) return
    const res = await fetch(`/api/applications/${selectedAppId}/resume-suggestions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: selectedResumeId, suggestionId, status }),
    })
    if (res.ok) mutate()
  }, [selectedAppId, selectedResumeId, row, mutate])

  const accept = useCallback(async (s: SuggestionItem) => {
    await navigator.clipboard.writeText(s.text)
    setCopied(s.id)
    setTimeout(() => setCopied(null), 2000)
    updateStatus(s.id, 'accepted')
  }, [updateStatus])

  const selectedApp = appsWithJD.find(a => a.applicationId === selectedAppId)

  const canGenerate = !!selectedResumeId && !!selectedAppId

  return (
    <div className="space-y-6">
      {/* Step 1 + 2: two-column picker */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Resume */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
            Your Resume
          </h3>
          <ResumeManager
            onSelectResume={setSelectedResumeId}
            selectedResumeId={selectedResumeId}
          />
        </div>

        {/* JD / Application */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Target Job Description
          </h3>

          {appsWithJD.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No applications with a job description found. Add a JD to an application first.
            </p>
          ) : (
            <select
              value={selectedAppId}
              onChange={e => { setSelectedAppId(e.target.value); mutate(null) }}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select application…</option>
              {appsWithJD.map(a => (
                <option key={a.applicationId} value={a.applicationId}>
                  {a.company} — {a.jobTitle}{a.level ? ` (${a.level})` : ''}
                </option>
              ))}
            </select>
          )}

          {selectedApp && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedApp.company}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedApp.jobTitle}{selectedApp.role && selectedApp.role !== selectedApp.jobTitle ? ` · ${selectedApp.role}` : ''}
                {selectedApp.level ? ` · ${selectedApp.level}` : ''}
              </p>
            </div>
          )}

          <button
            onClick={generate}
            disabled={!canGenerate || generating}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {generating && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {generating ? 'Analysing…' : row ? 'Re-analyse' : 'Analyse Resume'}
          </button>

          {!selectedResumeId && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">Select a resume on the left to get started</p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          {/* Progress */}
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

          {/* Pending cards */}
          {pending.map(s => {
            const meta = TYPE_META[s.type]
            return (
              <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
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

                <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 flex gap-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <button
                    onClick={() => accept(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
                  >
                    {copied === s.id ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : 'Accept & Copy'}
                  </button>
                  <button
                    onClick={() => updateStatus(s.id, 'dismissed')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )
          })}

          {/* Accepted (collapsed) */}
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

          {/* All done state */}
          {pending.length === 0 && dismissed.length === 0 && accepted.length === suggestions.length && (
            <div className="text-center py-6 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              All suggestions accepted. Good luck with your application!
            </div>
          )}
        </div>
      )}

      {/* Empty state after selection */}
      {canGenerate && !generating && suggestions.length === 0 && (
        <div className="text-center py-10 text-sm text-zinc-500 dark:text-zinc-400">
          Click Analyse Resume to generate tailored suggestions.
        </div>
      )}
    </div>
  )
}
