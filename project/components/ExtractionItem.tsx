'use client'

import { useLocale } from '@/locales'
import type { JDText } from '@/components/types'

interface ExtractionItemProps {
  jdt: JDText
  onEdit: (jdt: JDText) => void
  onDelete: (id: string) => void
  onExtract: (id: string) => void
}

export default function ExtractionItem({ jdt, onEdit, onDelete, onExtract }: ExtractionItemProps) {
  const { t } = useLocale()
  const hasJD = Boolean(jdt.jobDescription)
  const preview = jdt.text.slice(0, 100) + (jdt.text.length > 100 ? '…' : '')

  const formattedDate = new Date(jdt.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const handleDelete = () => {
    if (window.confirm(t('deleteConfirm'))) {
      onDelete(jdt.id)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row: badges + date */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {hasJD ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('extracted')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
              {t('notExtracted')}
            </span>
          )}
          {jdt.applicationId && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              {t('linkedApplication')}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{formattedDate}</span>
      </div>

      {/* Text preview */}
      <p className="text-sm text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-700/40 rounded px-2.5 py-2 line-clamp-3">
        {preview}
      </p>

      {/* Actions */}
      <div className="mt-3 flex gap-2 justify-end flex-wrap">
        {!hasJD && (
          <button
            onClick={() => onExtract(jdt.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            {t('extract_btn')}
          </button>
        )}
        <button
          onClick={() => onEdit(jdt)}
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
