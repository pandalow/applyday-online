'use client'

import { useLocale } from '@/locales'

interface ApplicationControlsProps {
  search: string
  sort: string
  statusFilter: string
  onSearchChange: (v: string) => void
  onSortChange: (v: string) => void
  onStatusFilterChange: (v: string) => void
  onRefresh: () => void
}

const STATUS_OPTIONS = ['', 'prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const
const SORT_OPTIONS = [
  { value: '-createdAt', labelKey: 'sortDate' as const },
  { value: 'company',    labelKey: 'sortCompany' as const },
  { value: 'status',     labelKey: 'sortStatus' as const },
]

const CHIP_BADGE: Record<string, string> = {
  '':           'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
  prepared:     'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
  applied:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interviewed:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  offered:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}
const CHIP_ACTIVE: Record<string, string> = {
  '':           'ring-2 ring-zinc-400 dark:ring-zinc-300',
  prepared:     'ring-2 ring-zinc-500 dark:ring-zinc-400',
  applied:      'ring-2 ring-blue-500',
  interviewed:  'ring-2 ring-yellow-500',
  offered:      'ring-2 ring-green-500',
  rejected:     'ring-2 ring-red-500',
}

export default function ApplicationControls({
  search,
  sort,
  statusFilter,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onRefresh,
}: ApplicationControlsProps) {
  const { t } = useLocale()

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
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
            onChange={e => onSearchChange(e.target.value)}
            placeholder={`${t('search')}…`}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{t('sortBy')}:</span>
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            title={t('refresh')}
            className="p-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map(s => {
          const isActive = statusFilter === s
          return (
            <button
              key={s === '' ? '__all__' : s}
              onClick={() => onStatusFilterChange(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${CHIP_BADGE[s]} ${isActive ? CHIP_ACTIVE[s] : 'opacity-70 hover:opacity-100'}`}
            >
              {s === '' ? t('all') : t(s as Parameters<typeof t>[0])}
            </button>
          )
        })}
      </div>
    </div>
  )
}
