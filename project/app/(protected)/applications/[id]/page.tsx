'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/locales'
import ApplicationDetail from '@/components/ApplicationDetail'
import InsightJob from '@/components/InsightJob'
import InsightResume from '@/components/InsightResume'
import CoverLetter from '@/components/CoverLetter'
import InsightOKR from '@/components/InsightOKR'

type Tab = 'jd' | 'jobinsight' | 'resume' | 'coverletter' | 'okr'

interface AppInfo {
  id: string
  company: string
  jobTitle: string
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  prepared:    'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400',
  applied:     'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  interviewed: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  offered:     'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  rejected:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

export default function WorkspacePage() {
  const { t } = useLocale()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = params.id

  const initialTab = (searchParams.get('tab') as Tab) || 'jd'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [app, setApp] = useState<AppInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/applications/${applicationId}`)
      .then(r => r.ok ? r.json() as Promise<AppInfo> : null)
      .then(data => { if (data) setApp(data) })
      .finally(() => setLoading(false))
  }, [applicationId])

  const switchTab = (t: Tab) => {
    setTab(t)
    router.replace(`/applications/${applicationId}?tab=${t}`, { scroll: false })
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'jd',
      label: t('jdTab'),
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    },
    {
      key: 'jobinsight',
      label: t('jobInsight'),
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
    },
    {
      key: 'resume',
      label: t('resumeTab'),
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
    },
    {
      key: 'coverletter',
      label: t('coverLetterTab'),
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    },
    {
      key: 'okr',
      label: t('okrPrep'),
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><circle cx="12" cy="12" r="4" strokeWidth={2}/><line x1="12" y1="2" x2="12" y2="6" strokeWidth={2}/><line x1="12" y1="18" x2="12" y2="22" strokeWidth={2}/></svg>,
    },
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-64" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-40" />
        </div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-sm text-zinc-500">{t('error')} — application not found.</p>
        <a href="/app" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">← {t('application')}</a>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <a href="/app" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('application')}
        </a>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{app.company}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? STATUS_COLORS.prepared}`}>
            {t(app.status as Parameters<typeof t>[0])}
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{app.jobTitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === key
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'jd' && <ApplicationDetail applicationId={applicationId} />}
      {tab === 'jobinsight' && <InsightJob applicationId={applicationId} company={app.company} jobTitle={app.jobTitle} />}
      {tab === 'resume' && <InsightResume applicationId={applicationId} />}
      {tab === 'coverletter' && <CoverLetter applicationId={applicationId} />}
      {tab === 'okr' && <InsightOKR applicationId={applicationId} />}
    </div>
  )
}
