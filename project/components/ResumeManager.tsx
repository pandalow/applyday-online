'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import type { Resume } from '@/components/types'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
})

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

interface ResumeManagerProps {
  onSelectResume?: (id: string) => void
  selectedResumeId?: string
}

export default function ResumeManager({ onSelectResume, selectedResumeId }: ResumeManagerProps) {
  const { t } = useLocale()
  const { data, error, isLoading, mutate } = useSWR<Resume[]>('/api/resumes', fetcher, {
    revalidateOnFocus: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const resumes = data ?? []

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError('File is too large. Maximum size is 10 MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/resumes', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      mutate()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
    mutate()
    if (selectedResumeId === id) onSelectResume?.('')
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 py-5 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? t('loading') : t('uploadPDF')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploadError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="w-7 h-7 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{t('error')}: {String(error)}</p>
      )}

      {/* Resume list */}
      {!isLoading && !error && (
        <>
          {resumes.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">{t('noResumes')}</p>
          ) : (
            <div className="space-y-2">
              {resumes.map(resume => {
                const isSelected = selectedResumeId === resume.id
                return (
                  <div
                    key={resume.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                      isSelected
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    {/* PDF icon */}
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{resume.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {resume.text.length.toLocaleString()} {t('characters')} &middot;{' '}
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Select / Selected badge */}
                    {onSelectResume && (
                      <button
                        onClick={() => onSelectResume(resume.id)}
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                        }`}
                      >
                        {isSelected ? t('selectedResume') : t('selectResume')}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="shrink-0 p-1 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title={t('delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
