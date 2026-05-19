'use client'

import { useState, useEffect, useCallback } from 'react'
import Dashboard from '@/components/Dashboard'
import ApplicationControls from '@/components/ApplicationControls'
import ApplicationItem from '@/components/ApplicationItem'
import ApplicationForm from '@/components/ApplicationForm'
import { useLocale } from '@/locales'
import type { Application } from '@/components/types'

// ---- Client component (whole page is client-side) ----

function sortApplications(apps: Application[], sort: string): Application[] {
  return [...apps].sort((a, b) => {
    switch (sort) {
      case 'company':
        return a.company.localeCompare(b.company)
      case 'status':
        return a.status.localeCompare(b.status)
      case '-createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
}

export default function ApplicationPage() {
  const { t } = useLocale()

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const [statusFilter, setStatusFilter] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editApp, setEditApp] = useState<Application | undefined>(undefined)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' })
      if (!res.ok) throw new Error(res.statusText)
      const data: Application[] = await res.json()
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const handleDelete = async (id: string) => {
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    fetchApplications()
  }

  const handleEdit = (app: Application) => {
    setEditApp(app)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditApp(undefined)
    fetchApplications()
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditApp(undefined)
  }

  const filtered = sortApplications(
    applications.filter(app => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        app.company.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q)
      const matchStatus = !statusFilter || app.status === statusFilter
      return matchSearch && matchStatus
    }),
    sort,
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {t('application')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {applications.length} total applications
          </p>
        </div>
        <button
          onClick={() => { setEditApp(undefined); setShowForm(v => !v) }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('newApplication')}
        </button>
      </div>

      {/* Dashboard stats */}
      <Dashboard />

      {/* Controls */}
      <ApplicationControls
        search={search}
        sort={sort}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onStatusFilterChange={setStatusFilter}
        onRefresh={fetchApplications}
      />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-8 text-red-600 dark:text-red-400 text-sm">
          {t('error')}: {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <svg className="mx-auto w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-zinc-400 dark:text-zinc-600 text-sm">{t('noData')}</p>
          <button
            onClick={() => { setEditApp(undefined); setShowForm(true) }}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
          >
            Add your first application
          </button>
        </div>
      )}

      {/* Application list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(app => (
            <ApplicationItem
              key={app.id}
              application={app}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal overlay for form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleCloseForm}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ApplicationForm
              application={editApp}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  )
}
