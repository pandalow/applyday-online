'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale } from '@/locales'

interface Stats {
  total: number
  last7Days: number
  prepared: number
  applied: number
  interviewed: number
  offered: number
  rejected: number
  availableChannels: string[]
}

const STATUS_BAR_COLORS: Record<string, string> = {
  prepared:    'bg-zinc-400 dark:bg-zinc-500',
  applied:     'bg-blue-500',
  interviewed: 'bg-yellow-500',
  offered:     'bg-green-500',
  rejected:    'bg-red-500',
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  prepared:    'text-zinc-700 dark:text-zinc-300',
  applied:     'text-blue-700 dark:text-blue-300',
  interviewed: 'text-yellow-700 dark:text-yellow-300',
  offered:     'text-green-700 dark:text-green-300',
  rejected:    'text-red-700 dark:text-red-300',
}

const STATUS_CARD_COLORS: Record<string, string> = {
  prepared:    'border-zinc-200 dark:border-zinc-700',
  applied:     'border-blue-200 dark:border-blue-800',
  interviewed: 'border-yellow-200 dark:border-yellow-800',
  offered:     'border-green-200 dark:border-green-800',
  rejected:    'border-red-200 dark:border-red-800',
}

const FUNNEL_STATUSES = ['prepared', 'applied', 'interviewed', 'offered'] as const
const STATUS_KEYS = ['prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const

const DATE_PRESETS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y',  days: 365 },
  { label: 'All', days: 0  },
] as const

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { t } = useLocale()

  const [expanded, setExpanded] = useState(false)
  const [presetDays, setPresetDays] = useState(0)
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (presetDays > 0) params.set('dateFrom', daysAgoISO(presetDays))
    if (selectedChannels.size) params.set('channels', [...selectedChannels].join(','))
    return params.toString()
  }, [presetDays, selectedChannels])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/applications/stats${query ? `?${query}` : ''}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: Stats) => { setStats(data); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [query])

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev)
      next.has(ch) ? next.delete(ch) : next.add(ch)
      return next
    })
  }

  const availableChannels = stats?.availableChannels ?? []
  const hasChannels = availableChannels.length > 0

  const applyRate = stats && stats.prepared > 0
    ? Math.round((stats.applied / stats.prepared) * 100)
    : null

  const interviewRate = stats && stats.applied > 0
    ? Math.round((stats.interviewed / stats.applied) * 100)
    : null

  return (
    <div className="space-y-4">
      {/* Compact summary strip — always visible, click to expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 px-5 py-3.5 flex items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="flex items-center gap-5 flex-1 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('totalApplications')}</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              {loading ? '—' : (stats?.total ?? 0)}
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('last7Days')}</span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {loading ? '—' : (stats?.last7Days ?? 0)}
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('applyRate')}</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? '—' : (applyRate !== null ? `${applyRate}%` : 'N/A')}
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('interviewed')} rate</span>
            <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {loading ? '—' : (interviewRate !== null ? `${interviewRate}%` : 'N/A')}
            </span>
          </div>
        </div>
        {loading && (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin shrink-0" />
        )}
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && (
        <div className="text-center py-4 text-red-600 dark:text-red-400 text-sm">
          {t('error')}: {error}
        </div>
      )}

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && stats && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden space-y-4"
          >
            {/* Filter bar */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
                  Period
                </span>
                <div className="flex gap-1">
                  {DATE_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={e => { e.stopPropagation(); setPresetDays(p.days) }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        presetDays === p.days
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasChannels && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
                    Channel
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {availableChannels.map(ch => (
                      <button
                        key={ch}
                        onClick={e => { e.stopPropagation(); toggleChannel(ch) }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          selectedChannels.has(ch)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                    {selectedChannels.size > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedChannels(new Set()) }}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        ✕ clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm"
              >
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('totalApplications')}
                </p>
                <p className="text-4xl font-bold text-zinc-900 dark:text-white mt-1">{stats.total}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 shadow-sm"
              >
                <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                  {t('last7Days')}
                </p>
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.last7Days}</p>
              </motion.div>

              {STATUS_KEYS.map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * (i + 1) }}
                  className={`bg-white dark:bg-zinc-800 rounded-xl p-4 border shadow-sm ${STATUS_CARD_COLORS[key]}`}
                >
                  <div className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_BAR_COLORS[key]} mb-2`} />
                  <p className={`text-xs font-medium capitalize ${STATUS_TEXT_COLORS[key]}`}>{t(key)}</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{stats[key]}</p>
                </motion.div>
              ))}
            </div>

            {/* Conversion funnel */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  {t('conversionFunnel')}
                </h2>
                <div className="flex items-center gap-3">
                  {applyRate !== null && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {t('applyRate')} {applyRate}%
                    </span>
                  )}
                  {stats.rejected > 0 && (
                    <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                      {stats.rejected} {t('rejected')}
                    </span>
                  )}
                </div>
              </div>

              {stats.total === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">No data for selected filters</p>
              ) : (
                <div className="flex items-end gap-1.5">
                  {FUNNEL_STATUSES.map((key, i) => {
                    const value = stats[key]
                    const total = stats.total || 1
                    const pct = Math.round((value / total) * 100)
                    const prevKey = i > 0 ? FUNNEL_STATUSES[i - 1] : null
                    const prevValue = prevKey ? stats[prevKey] : null
                    const stepPct = prevValue != null && prevValue > 0
                      ? Math.round((value / prevValue) * 100)
                      : null
                    const barH = Math.max(pct * 1.5, value > 0 ? 14 : 0)

                    return (
                      <div key={key} className="flex items-end gap-1.5 flex-1">
                        {i > 0 && (
                          <div className="flex flex-col items-center justify-end shrink-0 pb-11 gap-0.5">
                            {stepPct !== null && (
                              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                                {stepPct}%
                              </span>
                            )}
                            <svg className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col justify-end" style={{ height: 160 }}>
                            <motion.div
                              className={`w-full ${STATUS_BAR_COLORS[key]} rounded-t-xl flex items-start justify-center pt-2 overflow-hidden`}
                              initial={{ height: 0 }}
                              animate={{ height: barH }}
                              transition={{ duration: 0.65, delay: i * 0.1, ease: 'easeOut' }}
                            >
                              {barH >= 28 && (
                                <span className="text-white text-sm font-bold leading-none">{value}</span>
                              )}
                            </motion.div>
                          </div>
                          <div className="text-center mt-2.5 space-y-0.5">
                            {barH < 28 && value > 0 && (
                              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{value}</p>
                            )}
                            <p className={`text-xs font-semibold capitalize ${STATUS_TEXT_COLORS[key]}`}>{t(key)}</p>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{pct}%</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
