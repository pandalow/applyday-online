'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import type { JobDescription } from '@/components/types'
import JDitem from '@/components/JDitem'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
})

const LEVEL_OPTIONS = ['', 'intern', 'junior', 'mid', 'senior', 'lead', 'manager'] as const

export default function JDpage() {
  const { t } = useLocale()
  const { data, error, isLoading, mutate } = useSWR<JobDescription[]>('/api/jd', fetcher, {
    revalidateOnFocus: false,
  })

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  const handleDelete = async (id: string) => {
    await fetch(`/api/jd/${id}`, { method: 'DELETE' })
    mutate()
  }

  const items = (data ?? []).filter(jd => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (jd.role ?? '').toLowerCase().includes(q)
      || (jd.company ?? '').toLowerCase().includes(q)
    const matchLevel = !levelFilter || jd.level === levelFilter
    return matchSearch && matchLevel
  })

  return (
    <div className="space-y-4">
      {/* Search + level filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${t('search')} ${t('role')} / ${t('company')}…`}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {LEVEL_OPTIONS.map(l => (
            <option key={l === '' ? '__all__' : l} value={l}>
              {l === '' ? `${t('all')} ${t('level')}` : l}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {items.length} {t('jobDescription')}{items.length !== 1 ? 's' : ''}
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">
          {t('error')}: {String(error)}
        </p>
      )}

      {/* Items */}
      {!isLoading && !error && (
        <>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {items.map(jd => (
                <JDitem key={jd.id} jd={jd} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
