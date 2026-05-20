'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Dashboard from '@/components/Dashboard'
import ApplicationControls from '@/components/ApplicationControls'
import ApplicationTable, { type ApplicationTableHandle } from '@/components/ApplicationTable'
import { useLocale } from '@/locales'
import type { Application } from '@/components/types'

function sortApplications(apps: Application[], sort: string): Application[] {
  return [...apps].sort((a, b) => {
    switch (sort) {
      case 'company': return a.company.localeCompare(b.company)
      case 'status':  return a.status.localeCompare(b.status)
      case '-createdAt':
      default:        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
}

export default function ApplicationPage() {
  const { t } = useLocale()
  const tableRef = useRef<ApplicationTableHandle>(null)

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState('-createdAt')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' })
      if (!res.ok) throw new Error(res.statusText)
      setApplications(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const handleUpdate = async (id: string, changes: Partial<Application>) => {
    // Optimistic update
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a))
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    if (!res.ok) fetchApplications() // revert on failure
  }

  const handleCreate = async (data: Omit<Application, 'id' | 'createdAt'>): Promise<string | null> => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    const created: Application = await res.json()
    fetchApplications()
    return created.id
  }

  const handleDelete = async (id: string) => {
    setApplications(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
  }

  const filtered = useMemo(() =>
    sortApplications(
      applications.filter(app => {
        const q = search.toLowerCase()
        const matchSearch = !q || app.company.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q)
        const matchStatus = !statusFilter || app.status === statusFilter
        return matchSearch && matchStatus
      }),
      sort,
    ),
  [applications, search, statusFilter, sort])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('application')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{applications.length} total applications</p>
        </div>
        <button
          onClick={() => tableRef.current?.addRow()}
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
      {!loading && !error && applications.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <svg className="mx-auto w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-zinc-400 dark:text-zinc-600 text-sm">{t('noData')}</p>
          <button
            onClick={() => tableRef.current?.addRow()}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
          >
            Add your first application
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <ApplicationTable
          ref={tableRef}
          applications={filtered}
          onUpdate={handleUpdate}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
