'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import ResumeManager from '@/components/ResumeManager'
import { getAIConfig } from '@/app/lib/aiConfig'
import { useLocale } from '@/locales'
import type { CoverLetterTone } from '@/app/db/schema'
import { card, cardHeader, sectionLabel } from '@/app/lib/styles'
import Button from '@/components/ui/Button'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

interface Props {
  applicationId: string
}

interface CoverLetterRow {
  id: string
  content: string
  tone: CoverLetterTone
  resumeId: string
  createdAt: string
  updatedAt: string
}

const TONES: { value: CoverLetterTone; label: string; desc: string }[] = [
  { value: 'professional',   label: 'Professional',   desc: 'Formal and polished' },
  { value: 'conversational', label: 'Conversational', desc: 'Warm and natural' },
  { value: 'enthusiastic',   label: 'Enthusiastic',   desc: 'Energetic and passionate' },
]

export default function CoverLetter({ applicationId }: Props) {
  const { t, lang } = useLocale()
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [tone, setTone] = useState<CoverLetterTone>('professional')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [aiConfigured, setAiConfigured] = useState(true)

  useEffect(() => {
    setAiConfigured(!!getAIConfig()?.apiKey)
  }, [])

  const { data: row, mutate } = useSWR<CoverLetterRow | null>(
    selectedResumeId
      ? `/api/applications/${applicationId}/cover-letter?resumeId=${selectedResumeId}`
      : null,
    fetcher,
    { onSuccess: (data) => { if (data) setEditedContent(data.content) } },
  )

  const content = editedContent ?? row?.content ?? ''
  const isDirty = row && editedContent !== null && editedContent !== row.content

  const generate = async () => {
    if (!selectedResumeId) return
    const cfg = getAIConfig()
    if (!cfg?.apiKey) { setError(t('aiKeyRequiredDesc')); return }
    setGenerating(true)
    setError(null)
    setEditedContent(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({ resumeId: selectedResumeId, tone, language: lang }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      const created = await res.json() as CoverLetterRow
      setEditedContent(created.content)
      mutate(created, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const save = useCallback(async () => {
    if (!selectedResumeId || editedContent === null) return
    setSaving(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/cover-letter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId, content: editedContent }),
      })
      if (res.ok) mutate()
    } finally {
      setSaving(false)
    }
  }, [applicationId, selectedResumeId, editedContent, mutate])

  const copy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          { num: 2, label: t('coverLetterGenerate'), done: !!row },
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
              <span className={`text-xs font-medium ${step.done ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Resume + Tone + Generate */}
      <div className={`${card} p-4 space-y-4`}>
        <h3 className={`${sectionLabel} flex items-center gap-2`}>
          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
          {t('stepUploadResume')}
        </h3>
        <ResumeManager onSelectResume={setSelectedResumeId} selectedResumeId={selectedResumeId} />

        {/* Tone selector */}
        <div>
          <p className={`${sectionLabel} mb-2`}>{t('coverLetterTone')}</p>
          <div className="flex gap-2 flex-wrap">
            {TONES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setTone(value)}
                className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                  tone === value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <p className={`text-xs font-semibold ${tone === value ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{label}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generate}
          disabled={!canGenerate}
          loading={generating}
          className="w-full"
        >
          <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
          {generating ? t('generating') : row ? t('coverLetterRegenerate') : t('coverLetterGenerate')}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Output */}
      {content && (
        <div className={`${card} overflow-hidden`}>
          <div className={`flex items-center justify-between ${cardHeader}`}>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('coverLetterResult')}</p>
              {row && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  {TONES.find(t => t.value === row.tone)?.label}
                </span>
              )}
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  {t('unsavedChanges')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <Button onClick={save} loading={saving}>
                  {saving ? t('saving') : t('save')}
                </Button>
              )}
              <Button variant="secondary" onClick={copy}>
                {copied ? (
                  <>
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {t('copy')}
                  </>
                )}
              </Button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setEditedContent(e.target.value)}
            rows={18}
            className="w-full px-5 py-4 text-sm text-zinc-800 dark:text-zinc-200 bg-transparent resize-y focus:outline-none leading-relaxed font-(--font-sans)"
          />
        </div>
      )}
    </div>
  )
}
