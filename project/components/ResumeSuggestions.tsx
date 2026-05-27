'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { Resume } from '@/components/types'
import type { SuggestionItem, SuggestionType } from '@/app/db/schema'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

interface SuggestionsRow {
  id: string
  suggestions: SuggestionItem[]
  createdAt: string
}

const TYPE_META: Record<SuggestionType, { label: string; color: string }> = {
  keyword_gap: { label: 'Keyword Gap', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  quantify:    { label: 'Quantify',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  reframe:     { label: 'Reframe',      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  add_section: { label: 'Add Section',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

interface Props {
  applicationId: string
  hasJD: boolean
}

export default function ResumeSuggestions({ applicationId, hasJD }: Props) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: resumes = [] } = useSWR<Resume[]>('/api/resumes', fetcher)

  const { data: row, mutate } = useSWR<SuggestionsRow | null>(
    selectedResumeId ? `/api/applications/${applicationId}/resume-suggestions?resumeId=${selectedResumeId}` : null,
    fetcher,
  )

  const suggestions: SuggestionItem[] = row?.suggestions ?? []
  const pending = suggestions.filter(s => s.status === 'pending')
  const accepted = suggestions.filter(s => s.status === 'accepted')
  const dismissed = suggestions.filter(s => s.status === 'dismissed')

  const generate = async () => {
    if (!selectedResumeId) return
    const cfg = getAIConfig()
    if (!cfg?.apiKey) {
      setError('AI API key not configured. Go to Settings.')
      return
    }
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

  if (!hasJD) {
    return (
      <div className="p-5">
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-400">
          Add a Job Description first before generating resume suggestions.
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-4">
      {/* Resume selector + generate */}
      <div className="flex items-center gap-3">
        <select
          value={selectedResumeId}
          onChange={e => setSelectedResumeId(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a resume…</option>
          {resumes.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={!selectedResumeId || generating}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors flex items-center gap-2"
        >
          {generating && <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {row ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {resumes.length === 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">No resumes uploaded yet. Go to the Reports page to upload one.</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Progress summary */}
      {suggestions.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{suggestions.length} suggestions</span>
          <span>·</span>
          <span className="text-emerald-600 dark:text-emerald-400">{accepted.length} accepted</span>
          <span>·</span>
          <span>{dismissed.length} dismissed</span>
          <span>·</span>
          <span className="text-indigo-600 dark:text-indigo-400">{pending.length} pending</span>
        </div>
      )}

      {/* Pending suggestions */}
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map(s => {
            const meta = TYPE_META[s.type]
            return (
              <div key={s.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.section}</span>
                    </div>

                    {s.original && (
                      <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Current</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-through">{s.original}</p>
                      </div>
                    )}

                    <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Suggestion</p>
                      <p className="text-sm text-zinc-900 dark:text-white">{s.text}</p>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{s.reason}</p>
                  </div>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-700 px-4 py-2 flex gap-2">
                  <button
                    onClick={() => accept(s)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
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
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Accepted (collapsed) */}
      {accepted.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline list-none flex items-center gap-1">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {accepted.length} accepted
          </summary>
          <div className="mt-2 space-y-2">
            {accepted.map(s => (
              <div key={s.id} className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 flex items-start gap-2 opacity-70">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.section}</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{s.text}</p>
                </div>
                <button onClick={() => updateStatus(s.id, 'pending')} className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">undo</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Empty state */}
      {selectedResumeId && !generating && suggestions.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">
          Click Generate to analyse your resume against this JD.
        </p>
      )}
    </div>
  )
}
