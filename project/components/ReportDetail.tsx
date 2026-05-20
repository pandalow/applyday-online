'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import { getAIConfig } from '@/app/lib/aiConfig'
import type { AnalysisReport } from '@/components/types'
import ReportItem from '@/components/ReportItem'
import ReportAnalysis from '@/components/ReportAnalysis'
import ResumeManager from '@/components/ResumeManager'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
})

type Tab = 'viz' | 'analysis'

export default function ReportDetail() {
  const { t } = useLocale()
  const { data, error, isLoading, mutate } = useSWR<AnalysisReport[]>(
    '/api/reports',
    fetcher,
    {
      revalidateOnFocus: false,
      // Poll every 2s while any report is still generating
      refreshInterval: (latest) =>
        latest?.some(r => r.status === 'pending') ? 2000 : 0,
    },
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('viz')

  // Insight generation state
  const [insightResumeId, setInsightResumeId] = useState('')
  const [insightLang, setInsightLang] = useState<'en' | 'zh'>('en')
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)

  const reports = data ?? []
  const selectedReport = reports.find(r => r.id === selectedId) ?? null

  // Auto-select first report on load
  const firstId = reports[0]?.id
  if (firstId && selectedId === null && reports.length > 0) {
    setSelectedId(firstId)
  }

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    if (selectedId === id) setSelectedId(reports.find(r => r.id !== id)?.id ?? null)
    mutate()
  }

  const handleGenerateInsight = async () => {
    if (!selectedId) return
    setInsightError(null)
    const cfg = getAIConfig()
    if (!cfg?.apiKey) {
      setInsightError('AI API key not configured. Go to Settings to add your key.')
      return
    }
    setGeneratingInsight(true)
    try {
      const res = await fetch(`/api/reports/${selectedId}/insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
        body: JSON.stringify({
          resumeId: insightResumeId || undefined,
          languages: insightLang,
        }),
      })
      if (!res.ok) {
        const bd = await res.json().catch(() => ({}))
        throw new Error((bd as { error?: string }).error ?? res.statusText)
      }
      await mutate()
      setActiveTab('analysis')
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingInsight(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-0">
      {/* Sidebar */}
      <div className="lg:w-64 shrink-0 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider px-1">
          {t('reports')}
        </h2>

        {isLoading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 px-1">{t('error')}: {String(error)}</p>
        )}
        {!isLoading && !error && reports.length === 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">{t('noReports')}</p>
        )}

        {reports.map(report => {
          const isActive = selectedId === report.id
          return (
            <div
              key={report.id}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
              onClick={() => setSelectedId(report.id)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-medium truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    Report
                  </p>
                  {report.status === 'pending' && (
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-indigo-500 animate-spin shrink-0" />
                  )}
                  {report.status === 'failed' && (
                    <span className="text-[10px] text-red-500 font-medium shrink-0">failed</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {report.status === 'pending' ? 'Generating…' : `${report.results?.length ?? 0} analyses`}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDeleteReport(report.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selectedReport ? (
          <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-600">
            <p className="text-sm">{t('noReports')}</p>
          </div>
        ) : (
          <>
            {/* Report header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Pending state */}
            {selectedReport.status === 'pending' && (
              <div className="flex items-center gap-3 py-16 justify-center text-zinc-400 dark:text-zinc-500">
                <div className="w-5 h-5 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
                <p className="text-sm">Generating report…</p>
              </div>
            )}

            {/* Failed state */}
            {selectedReport.status === 'failed' && (
              <div className="py-12 text-center">
                <p className="text-sm text-red-500 dark:text-red-400">Report generation failed.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Make sure the selected applications have job description text attached.
                </p>
              </div>
            )}

            {/* Tabs — only shown for done reports */}
            {selectedReport.status !== 'pending' && selectedReport.status !== 'failed' && (<>
            {/* Tabs */}
            <div className="flex gap-0.5 border-b border-zinc-200 dark:border-zinc-700">
              {(['viz', 'analysis'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {tab === 'viz' ? t('visualizations') : t('aiAnalysis')}
                </button>
              ))}
            </div>

            {/* Visualizations tab */}
            {activeTab === 'viz' && (
              <div className="space-y-4">
                {!selectedReport.results?.length ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">{t('noResults')}</p>
                ) : (
                  selectedReport.results.map(result => (
                    <ReportItem key={result.id} result={result} />
                  ))
                )}
              </div>
            )}

            {/* AI Analysis tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-5">
                {/* Generate insight form */}
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('generateInsight')}</h3>

                  {insightError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{insightError}</p>
                  )}

                  {/* Language */}
                  <div className="flex gap-2">
                    {(['en', 'zh'] as const).map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setInsightLang(l)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          insightLang === l
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {l === 'en' ? t('english') : t('chinese')}
                      </button>
                    ))}
                  </div>

                  {/* Resume selector (compact) */}
                  <details className="group">
                    <summary className="text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none list-none flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white">
                      <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {t('resume')}{insightResumeId ? ` (${t('selectedResume')})` : ` (${t('none')})`}
                    </summary>
                    <div className="mt-2 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                      <ResumeManager
                        onSelectResume={id => setInsightResumeId(prev => prev === id ? '' : id)}
                        selectedResumeId={insightResumeId}
                      />
                    </div>
                  </details>

                  <button
                    onClick={handleGenerateInsight}
                    disabled={generatingInsight}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {generatingInsight && (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    {generatingInsight ? t('loading') : t('generateInsight')}
                  </button>
                </div>

                {/* Summaries */}
                {!selectedReport.summaries?.length ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">{t('noSummaries')}</p>
                ) : (
                  [...(selectedReport.summaries ?? [])].reverse().map(summary => (
                    <div
                      key={summary.id}
                      className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm"
                    >
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                        {new Date(summary.createdAt).toLocaleString()}
                      </p>
                      <ReportAnalysis content={summary.content} />
                    </div>
                  ))
                )}
              </div>
            )}
            </>)}
          </>
        )}
      </div>
    </div>
  )
}
