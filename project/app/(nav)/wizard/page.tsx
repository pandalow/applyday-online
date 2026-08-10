'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAIConfig, PROVIDER_MODELS, PROVIDER_LABELS } from '@/app/lib/aiConfig'
import type { AIProvider } from '@/app/lib/aiConfig'
import { useLocale } from '@/locales'
import type { JobInsightContent } from '@/app/db/schema'
import { card, inputField, textareaField, fieldLabel, sectionLabel, alertAmber } from '@/app/lib/styles'
import Button from '@/components/ui/Button'
import JobInsightView, { VERDICT_CONFIG, exportToMarkdown } from '@/components/JobInsightView'

type StepStatus = 'idle' | 'running' | 'done' | 'error'

interface Step {
  id: string
  label: string
  detail: string
  status: StepStatus
  error?: string
}

interface ResumeEntry {
  id: string
  name: string
}

interface Result {
  applicationId?: string
  company: string
  jobTitle: string
  content: JobInsightContent
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'idle') return (
    <span className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 shrink-0" />
  )
  if (status === 'running') return (
    <span className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
  )
  if (status === 'done') return (
    <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
  return (
    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  )
}

const GUEST_INITIAL_STEPS: Step[] = [
  { id: 'extract', label: 'Extract company & job title', detail: '', status: 'idle' },
  { id: 'insight', label: 'Generate Job Insight',        detail: '', status: 'idle' },
]

const AUTH_INITIAL_STEPS: Step[] = [
  { id: 'extract', label: 'Extract company & job title', detail: '', status: 'idle' },
  { id: 'create',  label: 'Create application',          detail: '', status: 'idle' },
  { id: 'savejd',  label: 'Save job description',        detail: '', status: 'idle' },
  { id: 'insight', label: 'Generate Job Insight',        detail: '', status: 'idle' },
]

export default function WizardPage() {
  const { t, lang } = useLocale()

  const [isGuest, setIsGuest] = useState<boolean | null>(null)

  // Guest AI config
  const [guestKey, setGuestKey] = useState('')
  const [guestProvider, setGuestProvider] = useState<AIProvider>('openai')
  const [guestModel, setGuestModel] = useState('gpt-4o-mini')

  // Common input state
  const [jdText, setJdText] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [resumes, setResumes] = useState<ResumeEntry[]>([])

  // Flow state
  const [stage, setStage] = useState<'input' | 'running' | 'done'>('input')
  const [steps, setSteps] = useState<Step[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [aiConfigured, setAiConfigured] = useState(true)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json() as Promise<{ isAuth: boolean }>)
      .then(({ isAuth }) => {
        setIsGuest(!isAuth)
        setSteps(isAuth ? AUTH_INITIAL_STEPS : GUEST_INITIAL_STEPS)
        if (isAuth) {
          setAiConfigured(!!getAIConfig()?.apiKey)
          fetch('/api/resumes')
            .then(r => r.ok ? r.json() as Promise<ResumeEntry[]> : [])
            .then(setResumes)
        }
      })
      .catch(() => {
        setIsGuest(true)
        setSteps(GUEST_INITIAL_STEPS)
      })
  }, [])

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const analyzeGuest = async () => {
    const aiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AI-Key': guestKey,
      'X-AI-Provider': guestProvider,
      'X-AI-Model': guestModel,
      'X-AI-Reasoning': 'false',
    }

    setStage('running')
    setSteps(GUEST_INITIAL_STEPS)

    try {
      updateStep('extract', { status: 'running' })
      const extractRes = await fetch('/api/try/extract', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({ jdText }),
      })
      if (!extractRes.ok) throw new Error((await extractRes.json().catch(() => ({}))).error ?? 'Extraction failed')
      const { company: rawCompany, jobTitle: rawJobTitle } = await extractRes.json() as { company: string; jobTitle: string }
      const company = rawCompany || 'Unknown'
      const jobTitle = rawJobTitle || 'Unknown'
      updateStep('extract', { status: 'done', detail: [company, jobTitle].filter(s => s !== 'Unknown').join(' · ') || `${company} · ${jobTitle}` })

      updateStep('insight', { status: 'running' })
      const insightRes = await fetch('/api/try/job-insight', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({ jdText, resumeText: resumeText.trim() || undefined, language: lang }),
      })
      if (!insightRes.ok) {
        const bd = await insightRes.json().catch(() => ({}))
        throw new Error((bd as { error?: string }).error ?? 'Insight generation failed')
      }
      const { content } = await insightRes.json() as { content: JobInsightContent }
      updateStep('insight', { status: 'done' })

      setResult({ company, jobTitle, content })
      setStage('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', error: msg } : s))
    }
  }

  const analyzeAuth = async () => {
    const cfg = getAIConfig()
    if (!cfg?.apiKey) return

    const aiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AI-Key': cfg.apiKey,
      'X-AI-Provider': cfg.provider,
      'X-AI-Model': cfg.model,
      'X-AI-Reasoning': String(cfg.reasoning),
    }

    setStage('running')
    setSteps(AUTH_INITIAL_STEPS)

    try {
      updateStep('extract', { status: 'running' })
      const extractRes = await fetch('/api/wizard/extract', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({ jdText }),
      })
      if (!extractRes.ok) throw new Error((await extractRes.json().catch(() => ({}))).error ?? 'Extraction failed')
      const { company, jobTitle } = await extractRes.json() as { company: string; jobTitle: string }
      const effectiveCompany = company || 'Unknown'
      const effectiveJobTitle = jobTitle || 'Unknown'
      updateStep('extract', {
        status: 'done',
        detail: [effectiveCompany, effectiveJobTitle].filter(s => s !== 'Unknown').join(' · ') || `${effectiveCompany} · ${effectiveJobTitle}`,
      })

      updateStep('create', { status: 'running' })
      const createRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: effectiveCompany, jobTitle: effectiveJobTitle }),
      })
      if (!createRes.ok) throw new Error('Failed to create application')
      const app = await createRes.json() as { id: string }
      updateStep('create', { status: 'done', detail: app.id })

      updateStep('savejd', { status: 'running' })
      const saveRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jdText, applicationId: app.id }),
      })
      if (!saveRes.ok) throw new Error('Failed to save job description')
      updateStep('savejd', { status: 'done' })

      updateStep('insight', { status: 'running' })
      const insightRes = await fetch(`/api/applications/${app.id}/job-insight`, {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({ resumeId: selectedResumeId || undefined, language: lang }),
      })
      if (!insightRes.ok) {
        const bd = await insightRes.json().catch(() => ({}))
        throw new Error((bd as { error?: string }).error ?? 'Insight generation failed')
      }
      const insightRow = await insightRes.json() as { content: JobInsightContent }
      updateStep('insight', { status: 'done' })

      setResult({ applicationId: app.id, company: company || 'Unknown', jobTitle, content: insightRow.content })
      setStage('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', error: msg } : s))
    }
  }

  const analyze = () => isGuest ? analyzeGuest() : analyzeAuth()

  const handleExport = () => {
    if (!result) return
    const md = exportToMarkdown(result.content, result.company, result.jobTitle)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.company}_${result.jobTitle}_insight.md`.replace(/\s+/g, '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setJdText('')
    setResumeText('')
    setSelectedResumeId('')
    setResult(null)
    setStage('input')
    setSteps(isGuest ? GUEST_INITIAL_STEPS : AUTH_INITIAL_STEPS)
  }

  if (isGuest === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  const canAnalyze = !!jdText.trim() && (isGuest ? !!guestKey.trim() : aiConfigured)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('quickStart')}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t('wizardDesc')}</p>
      </div>

      {/* Trial mode banner */}
      {isGuest && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300">{t('trialBannerDesc')}</p>
          </div>
          <Link href="/register" className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-400 underline hover:no-underline whitespace-nowrap">
            {t('signUpToSave')}
          </Link>
        </div>
      )}

      {/* AI key warning for logged-in users */}
      {!isGuest && !aiConfigured && (
        <div className={alertAmber}>
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

      {/* Input stage */}
      {stage === 'input' && (
        <div className={`${card} p-5 space-y-4`}>
          {/* Guest inline AI config */}
          {isGuest && (
            <div className="space-y-3 pb-4 border-b border-zinc-100 dark:border-zinc-700">
              <p className={sectionLabel}>{t('wizardApiKeySection')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={fieldLabel}>{t('wizardProviderLabel')}</label>
                  <select
                    value={guestProvider}
                    onChange={e => {
                      const p = e.target.value as AIProvider
                      setGuestProvider(p)
                      setGuestModel(PROVIDER_MODELS[p][0].id)
                    }}
                    className={inputField}
                  >
                    {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(p => (
                      <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>{t('wizardModelLabel')}</label>
                  <select
                    value={guestModel}
                    onChange={e => setGuestModel(e.target.value)}
                    className={inputField}
                  >
                    {PROVIDER_MODELS[guestProvider].map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>{t('wizardApiKeyLabel')}</label>
                  <input
                    type="password"
                    value={guestKey}
                    onChange={e => setGuestKey(e.target.value)}
                    placeholder={t('wizardApiKeyPlaceholder')}
                    className={inputField}
                  />
                </div>
              </div>
            </div>
          )}

          {/* JD text */}
          <div>
            <label className={fieldLabel}>{t('wizardJDLabel')}</label>
            <textarea
              rows={12}
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder={t('wizardJDPlaceholder')}
              className={textareaField}
            />
          </div>

          {/* Resume */}
          {isGuest ? (
            <div>
              <label className={fieldLabel}>
                {t('jobInsightSelectResume')} <span className="font-normal text-zinc-400">({t('optional')})</span>
              </label>
              <textarea
                rows={5}
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder={t('wizardResumeTextPlaceholder')}
                className={textareaField}
              />
            </div>
          ) : (
            <div>
              <label className={fieldLabel}>
                {t('jobInsightSelectResume')} <span className="font-normal text-zinc-400">({t('optional')})</span>
              </label>
              <select
                value={selectedResumeId}
                onChange={e => setSelectedResumeId(e.target.value)}
                className={inputField}
              >
                <option value="">{t('jobInsightNoResume')}</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button onClick={analyze} disabled={!canAnalyze}>
            {t('wizardAnalyze')}
          </Button>
        </div>
      )}

      {/* Running / error stage */}
      {stage === 'running' && (
        <div className={`${card} p-5`}>
          <p className={`${sectionLabel} mb-4`}>{t('wizardAnalyzing')}</p>
          <div className="space-y-3">
            {steps.map(step => (
              <div key={step.id} className="flex items-start gap-3">
                <StepIcon status={step.status} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.status === 'done'    ? 'text-emerald-700 dark:text-emerald-400' :
                    step.status === 'running' ? 'text-indigo-600 dark:text-indigo-400' :
                    step.status === 'error'   ? 'text-red-600 dark:text-red-400' :
                    'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {step.label}
                  </p>
                  {step.status === 'done' && step.detail && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{step.detail}</p>
                  )}
                  {step.error && (
                    <p className="text-xs text-red-500 mt-0.5">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {steps.some(s => s.status === 'error') && (
            <div className="mt-4">
              <Button variant="secondary" onClick={reset}>{t('back')}</Button>
            </div>
          )}
        </div>
      )}

      {/* Done stage */}
      {stage === 'done' && result && (
        <>
          <div className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  {t('wizardComplete')}
                </p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {result.jobTitle}{result.company ? ` · ${result.company}` : ''}
                </p>
                {(() => {
                  const v = VERDICT_CONFIG[result.content.matchAnalysis.verdict]
                  return (
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${v.bg} ${v.color}`}>
                      {v.label}
                    </span>
                  )
                })()}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {result.applicationId ? (
                  <Link
                    href={`/workspace?app=${result.applicationId}&tab=jobinsight`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    {t('openWorkspace')}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {t('signUpToSave')}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                <Button variant="secondary" onClick={handleExport}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('exportMd')}
                </Button>
                <Button variant="secondary" onClick={reset}>{t('wizardAnalyzeAnother')}</Button>
              </div>
            </div>

            {/* Guest sign-up nudge */}
            {!result.applicationId && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('guestSignUpCta')}</p>
              </div>
            )}
          </div>

          <JobInsightView content={result.content} company={result.company} jobTitle={result.jobTitle} />
        </>
      )}
    </div>
  )
}
