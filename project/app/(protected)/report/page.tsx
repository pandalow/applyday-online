'use client'

import { useState } from 'react'
import ReportGenerator from '@/components/ReportGenerator'
import ReportDetail from '@/components/ReportDetail'

export default function ReportPage() {
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  const handleSuccess = (id: string) => {
    setGeneratedId(id)
    setShowGenerator(false)
    // ReportDetail will auto-select the new report via SWR revalidation
    void id // consumed to suppress lint
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Market Reports</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Analyse your job description collection with charts and AI insights.
          </p>
        </div>
        <button
          onClick={() => setShowGenerator(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showGenerator ? 'Hide Generator' : 'New Report'}
        </button>
      </div>

      {/* Layout: generator panel + report detail */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Generator panel */}
        {showGenerator && (
          <aside className="lg:w-80 shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
                Generate Report
              </h2>
              <ReportGenerator onSuccess={handleSuccess} />
            </div>
          </aside>
        )}

        {/* Report viewer */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <ReportDetail />
          </div>
        </div>
      </div>

      {/* Success toast */}
      {generatedId && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          onClick={() => setGeneratedId(null)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Report generated! Click to dismiss.
        </div>
      )}
    </div>
  )
}
