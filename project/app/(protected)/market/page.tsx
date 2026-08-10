'use client'

import { useState } from 'react'
import { useLocale } from '@/locales'
import ReportGenerator from '@/components/ReportGenerator'
import ReportDetail from '@/components/ReportDetail'

export default function MarketPage() {
  const { t } = useLocale()
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedId, setGeneratedId] = useState<string | null>(null)

  const handleReportSuccess = (id: string) => {
    setGeneratedId(id)
    setShowGenerator(false)
    void id
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('market')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t('insightMarketDesc')}</p>
        </div>
        <button
          onClick={() => setShowGenerator(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showGenerator ? t('cancel') : t('newReport')}
        </button>
      </div>

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
