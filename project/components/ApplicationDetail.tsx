'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from '@/locales'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { JobDescription, JDText } from '@/components/types'
import { card } from '@/app/lib/styles'
import Button from '@/components/ui/Button'

interface Props {
  applicationId: string
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => (
        <span key={item} className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{item}</span>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  )
}

export default function ApplicationDetail({ applicationId }: Props) {
  const { t } = useLocale()
  const [loading, setLoading] = useState(true)
  const [jdText, setJdText] = useState<JDText | null>(null)
  const [inputText, setInputText] = useState('')
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<JobDescription | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/extract?applicationId=${applicationId}`)
    if (res.ok) {
      const rows: JDText[] = await res.json()
      if (rows.length > 0) {
        setJdText(rows[0])
        setInputText(rows[0].text)
        setExtracted(rows[0].jobDescription ?? null)
      }
    }
    setLoading(false)
  }, [applicationId])

  useEffect(() => { load() }, [load])

  const saveText = async () => {
    if (!inputText.trim()) return
    setSaving(true)
    try {
      if (jdText) {
        const res = await fetch(`/api/extract/${jdText.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        })
        if (res.ok) setJdText(prev => prev ? { ...prev, text: inputText } : prev)
      } else {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText, applicationId }),
        })
        if (res.ok) {
          const created: JDText = await res.json()
          setJdText({ ...created, jobDescription: undefined })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const extract = async () => {
    if (!jdText) return
    const cfg = getAIConfig()
    if (!cfg?.apiKey) {
      alert('AI API key not configured. Go to Settings to add your key.')
      return
    }
    setExtracting(true)
    try {
      const res = await fetch('/api/jd/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({ jobTextId: jdText.id }),
      })
      if (res.ok) setExtracted(await res.json())
    } finally {
      setExtracting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-zinc-400">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-200 dark:border-zinc-600 border-t-indigo-500 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* JD Text editor */}
      <div className={`${card} p-4 space-y-3`}>
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Job Description
        </label>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          rows={6}
          placeholder="Paste the job description here…"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={saveText}
            disabled={saving || !inputText.trim()}
            loading={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {jdText && (
            <Button onClick={extract} loading={extracting}>
              {!extracting && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {extracting ? 'Extracting…' : 'Extract with AI'}
            </Button>
          )}
        </div>
      </div>

      {/* Extracted JD display */}
      {extracted && (
        <div className={`${card} p-4 space-y-3`}>
          <div className="flex flex-wrap gap-2 items-center">
            {extracted.role && <span className="font-semibold text-zinc-900 dark:text-white text-sm">{extracted.role}</span>}
            {extracted.level && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {extracted.level}
              </span>
            )}
            {extracted.remoteWork && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                {extracted.remoteWork}
              </span>
            )}
            {extracted.location && <span className="text-sm text-zinc-500 dark:text-zinc-400">{extracted.location}</span>}
          </div>

          {(extracted.salaryEurMin || extracted.salaryEurMax) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('salaryRange')}: €{extracted.salaryEurMin?.toLocaleString() ?? '?'}
              {extracted.salaryEurMax ? ` – €${extracted.salaryEurMax.toLocaleString()}` : '+'}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {extracted.requiredCoreSkills?.length ? (
              <Section label={t('requiredSkills')}>
                <TagList items={extracted.requiredCoreSkills} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" />
              </Section>
            ) : null}
            {extracted.programmingLanguages?.length ? (
              <Section label={t('programmingLanguages')}>
                <TagList items={extracted.programmingLanguages} color="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />
              </Section>
            ) : null}
            {extracted.frameworksTools?.length ? (
              <Section label={t('frameworksTools')}>
                <TagList items={extracted.frameworksTools} color="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" />
              </Section>
            ) : null}
            {extracted.desirableSkills?.length ? (
              <Section label={t('desirableSkills')}>
                <TagList items={extracted.desirableSkills} color="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" />
              </Section>
            ) : null}
            {extracted.databases?.length ? (
              <Section label={t('databases')}>
                <TagList items={extracted.databases} color="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" />
              </Section>
            ) : null}
            {extracted.cloudPlatforms?.length ? (
              <Section label={t('cloudPlatforms')}>
                <TagList items={extracted.cloudPlatforms} color="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" />
              </Section>
            ) : null}
          </div>

          {extracted.benefits?.length ? (
            <Section label={t('benefits')}>
              <ul className="list-disc list-inside space-y-0.5">
                {extracted.benefits.map((b, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{b}</li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      )}
    </div>
  )
}
