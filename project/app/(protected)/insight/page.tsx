'use client'

import { useState } from 'react'
import { useLocale } from '@/locales'
import ReportGenerator from '@/components/ReportGenerator'
import ReportDetail from '@/components/ReportDetail'
import InsightOKR from '@/components/InsightOKR'

type Tab = 'okr' | 'market'

export default function InsightPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>('okr')
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedId, setGeneratedId] = useState<string | null>(null)

  const handleReportSuccess = (id: string) => {
    setGeneratedId(id)
    setShowGenerator(false)
    void id
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('insight')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {tab === 'okr' ? t('insightOKRDesc') : t('insightMarketDesc')}
          </p>
        </div>
        {tab === 'market' && (
          <button
            onClick={() => setShowGenerator(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showGenerator ? t('cancel') : t('newReport')}
          </button>
        )}
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {([
          { key: 'okr',    label: t('okrPrep') },
          { key: 'market', label: t('marketReport') },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === key
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OKR & Prep tab */}
      {tab === 'okr' && (
        <InsightOKR />
      )}

      {/* Market Report tab */}
      {tab === 'market' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {showGenerator && (
            <aside className="lg:w-80 shrink-0">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
                  {t('generateReport')}
                </h2>
                <ReportGenerator onSuccess={handleReportSuccess} />
              </div>
            </aside>
          )}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <ReportDetail />
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {generatedId && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          onClick={() => setGeneratedId(null)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('success')} — {t('generateReport')}
        </div>
      )}
    </div>
  )
}
