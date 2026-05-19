'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocale } from '@/locales'

interface Stats {
  total: number
  prepared: number
  applied: number
  interviewed: number
  offered: number
  rejected: number
}

const STATUS_COLORS: Record<string, string> = {
  prepared:   'bg-zinc-400 dark:bg-zinc-500',
  applied:    'bg-blue-500',
  interviewed:'bg-yellow-500',
  offered:    'bg-green-500',
  rejected:   'bg-red-500',
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  prepared:   'text-zinc-700 dark:text-zinc-300',
  applied:    'text-blue-700 dark:text-blue-300',
  interviewed:'text-yellow-700 dark:text-yellow-300',
  offered:    'text-green-700 dark:text-green-300',
  rejected:   'text-red-700 dark:text-red-300',
}

const FUNNEL_STATUSES = ['prepared', 'applied', 'interviewed', 'offered'] as const

export default function Dashboard() {
  const { t } = useLocale()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/applications/stats')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: Stats) => { setStats(data); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400 text-sm">
        {t('error')}: {error}
      </div>
    )
  }

  const statusKeys = ['prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const

  return (
    <div className="space-y-6">
      {/* Total + status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 sm:col-span-3 lg:col-span-1 bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm"
        >
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {t('totalApplications')}
          </p>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white mt-1">{stats.total}</p>
        </motion.div>

        {statusKeys.map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * (i + 1) }}
            className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm"
          >
            <div className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLORS[key]} mb-2`} />
            <p className={`text-xs font-medium capitalize ${STATUS_TEXT_COLORS[key]}`}>
              {t(key)}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{stats[key]}</p>
          </motion.div>
        ))}
      </div>

      {/* Conversion funnel */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 uppercase tracking-wider">
          {t('conversionFunnel')}
        </h2>
        <div className="space-y-2.5">
          {FUNNEL_STATUSES.map((key, i) => {
            const value = stats[key]
            const base = stats.prepared > 0 ? stats.prepared : 1
            const pct = Math.min(100, Math.round((value / base) * 100))
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-20 text-right capitalize ${STATUS_TEXT_COLORS[key]}`}>
                  {t(key)}
                </span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.1 * i, ease: 'easeOut' }}
                    className={`h-full rounded-full ${STATUS_COLORS[key]} flex items-center justify-end pr-2`}
                  >
                    {pct > 10 && (
                      <span className="text-[10px] font-semibold text-white">{value}</span>
                    )}
                  </motion.div>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 w-10">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
