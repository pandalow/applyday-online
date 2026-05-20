'use client'

import { useLocale } from '@/locales'
import { STATUS_COLORS } from '@/components/applicationStatus'
import { formatDate } from '@/app/lib/formatDate'
import type { Application } from '@/components/types'

interface ApplicationItemProps {
  application: Application
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
}

export default function ApplicationItem({ application, onEdit, onDelete }: ApplicationItemProps) {
  const { t } = useLocale()
  const badgeClass = STATUS_COLORS[application.status] ?? STATUS_COLORS.prepared

  const handleDelete = () => {
    if (window.confirm(t('deleteConfirm'))) onDelete(application.id)
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-white truncate">{application.company}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{application.jobTitle}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
          {t(application.status as Parameters<typeof t>[0]) ?? application.status}
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        {t('applicationDate')}: {formatDate(application.applicationDate)}
      </p>

      {application.stageNotes && (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 bg-zinc-50 dark:bg-zinc-700/50 rounded px-2 py-1">
          {application.stageNotes}
        </p>
      )}

      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={() => onEdit(application)}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
        >
          {t('edit')}
        </button>
        <button
          onClick={handleDelete}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          {t('delete')}
        </button>
      </div>
    </div>
  )
}
