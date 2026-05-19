'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/locales'
import type { Application } from '@/components/types'

interface ApplicationFormProps {
  application?: Application
  onSuccess: () => void
  onCancel: () => void
}

const STATUS_OPTIONS = ['prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const

export default function ApplicationForm({ application, onSuccess, onCancel }: ApplicationFormProps) {
  const { t } = useLocale()
  const isEdit = Boolean(application)

  const [company, setCompany] = useState(application?.company ?? '')
  const [jobTitle, setJobTitle] = useState(application?.jobTitle ?? '')
  const [status, setStatus] = useState(application?.status ?? 'prepared')
  const [stageNotes, setStageNotes] = useState(application?.stageNotes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (application) {
      setCompany(application.company)
      setJobTitle(application.jobTitle)
      setStatus(application.status)
      setStageNotes(application.stageNotes ?? '')
    }
  }, [application])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!company.trim() || !jobTitle.trim()) {
      setError('Company and Job Title are required.')
      return
    }
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/applications/${application!.id}` : '/api/applications'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, jobTitle, status, stageNotes: stageNotes || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
        {isEdit ? t('editApplication') : t('newApplication')}
      </h2>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Company */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t('company')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Acme Corp"
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t('jobTitle')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder="Software Engineer"
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t('status')}
        </label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {t(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Stage Notes */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t('stageNotes')}
        </label>
        <textarea
          value={stageNotes}
          onChange={e => setStageNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes about this application stage…"
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {submitting ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  )
}
