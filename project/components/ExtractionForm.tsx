'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/locales'

interface Application {
  id: string
  company: string
  jobTitle: string
}

interface ExtractionFormProps {
  onSuccess: () => void
  applicationId?: string
}

export default function ExtractionForm({ onSuccess, applicationId: initAppId }: ExtractionFormProps) {
  const { t } = useLocale()
  const [text, setText] = useState('')
  const [selectedAppId, setSelectedAppId] = useState(initAppId ?? '')
  const [applications, setApplications] = useState<Application[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => (r.ok ? r.json() : []))
      .then((data: Application[]) => setApplications(data))
      .catch(() => setApplications([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!text.trim()) {
      setError('Please enter some job description text.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          applicationId: selectedAppId || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      setText('')
      setSelectedAppId('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Application selector */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t('linkedApplication')} ({t('none')})
        </label>
        <select
          value={selectedAppId}
          onChange={e => setSelectedAppId(e.target.value)}
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t('none')}</option>
          {applications.map(app => (
            <option key={app.id} value={app.id}>
              {app.company} — {app.jobTitle}
            </option>
          ))}
        </select>
      </div>

      {/* Raw JD text area */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t('rawText')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          placeholder={t('enterJDText')}
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        />
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 text-right">
          {text.length.toLocaleString()} {t('characters')}
        </p>
      </div>

      <div className="flex justify-end">
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
