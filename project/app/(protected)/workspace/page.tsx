'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/locales'
import ApplicationDetail from '@/components/ApplicationDetail'
import InsightJob from '@/components/InsightJob'
import InsightResume from '@/components/InsightResume'
import CoverLetter from '@/components/CoverLetter'
import InsightOKR from '@/components/InsightOKR'

type Tab = 'jobinsight' | 'resume' | 'coverletter' | 'okr' | 'jd'

interface AppOption {
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const [apps, setApps] = useState<AppOption[]>([])
  const [selectedId, setSelectedId] = useState(searchParams.get('app') ?? '')
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'jobinsight')

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.ok ? r.json() as Promise<AppOption[]> : [])
      .then(setApps)
  }, [])

  const selectedApp = apps.find(a => a.id === selectedId) ?? null

  const selectApp = (id: string) => {
    setSelectedId(id)
    setTab('jobinsight')
    router.replace(`/workspace?app=${id}&tab=jobinsight`, { scroll: false })
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    router.replace(`/workspace?app=${selectedId}&tab=${t}`, { scroll: false })
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
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
    {
      key: 'jd',
      label: t('jdTab'),
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('workspace')}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t('workspaceDesc')}</p>
      </div>

      <div className="flex gap-4 items-start">
        {/* App list sidebar */}
        <div className="w-56 shrink-0 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden self-start sticky top-20">
          <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-700">
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {t('application')}
            </p>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
            {apps.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 px-3 py-4">No applications yet.</p>
            ) : (
              apps.map(a => (
                <button
                  key={a.id}
                  onClick={() => selectApp(a.id)}
                  className={`w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors border-l-2 ${
                    selectedId === a.id
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20'
                      : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-700/40'
                  }`}
                >
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate leading-tight">
                    {a.company}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                    {a.jobTitle}
                  </span>
                  <span className={`mt-1 self-start px-1.5 py-px text-[10px] font-medium rounded-full ${STATUS_COLORS[a.status] ?? STATUS_COLORS.prepared}`}>
                    {t(a.status as Parameters<typeof t>[0])}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('workspaceSelectPrompt')}</p>
            </div>
          ) : selectedApp ? (
            <div className="space-y-0">
              {/* Tab bar */}
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

              <div className="pt-4">
                {tab === 'jobinsight'  && <InsightJob applicationId={selectedId} company={selectedApp.company} jobTitle={selectedApp.jobTitle} />}
                {tab === 'resume'      && <InsightResume applicationId={selectedId} />}
                {tab === 'coverletter' && <CoverLetter applicationId={selectedId} />}
                {tab === 'okr'         && <InsightOKR applicationId={selectedId} />}
                {tab === 'jd'          && <ApplicationDetail applicationId={selectedId} />}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
