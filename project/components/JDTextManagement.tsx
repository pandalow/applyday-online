'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import type { JDText } from '@/components/types'
import ExtractionForm from '@/components/ExtractionForm'
import ExtractionItem from '@/components/ExtractionItem'
import Extracting from '@/components/Extracting'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
})

const PAGE_SIZE = 10

export default function JDTextManagement() {
  const { t } = useLocale()
  const { data, error, isLoading, mutate } = useSWR<JDText[]>('/api/extract', fetcher, {
    revalidateOnFocus: false,
  })

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<JDText | null>(null)
  const [editText, setEditText] = useState('')
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const items = data ?? []
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Delete
  const handleDelete = async (id: string) => {
    await fetch(`/api/extract/${id}`, { method: 'DELETE' })
    mutate()
  }

  // Edit save
  const handleEditSave = async () => {
    if (!editItem) return
    await fetch(`/api/extract/${editItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText }),
    })
    setEditItem(null)
    mutate()
  }

  // AI Extract
  const handleExtract = async (id: string) => {
    setExtractingId(id)
    try {
      await fetch('/api/jd/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTextId: id }),
      })
      mutate()
    } finally {
      setExtractingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          {t('rawText')} ({items.length})
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
        >
          {showForm ? t('cancel') : `+ ${t('create')}`}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
          <ExtractionForm
            onSuccess={() => { setShowForm(false); mutate() }}
          />
        </div>
      )}

      {/* Edit modal (inline) */}
      {editItem && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-indigo-300 dark:border-indigo-600 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t('edit')}</h3>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditItem(null)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
              {t('cancel')}
            </button>
            <button onClick={handleEditSave} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">{t('error')}: {String(error)}</p>
      )}

      {/* Items */}
      {!isLoading && !error && (
        <>
          {pageItems.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {pageItems.map(jdt => (
                extractingId === jdt.id ? (
                  <div key={jdt.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                    <Extracting message={t('extracting')} />
                  </div>
                ) : (
                  <ExtractionItem
                    key={jdt.id}
                    jdt={jdt}
                    onEdit={item => { setEditItem(item); setEditText(item.text) }}
                    onDelete={handleDelete}
                    onExtract={handleExtract}
                  />
                )
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              >
                {t('previous')}
              </button>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('page')} {page} {t('of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
