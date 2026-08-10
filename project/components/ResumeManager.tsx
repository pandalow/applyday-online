'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import { useLocale } from '@/locales'
import type { Resume } from '@/components/types'
import { textareaField } from '@/app/lib/styles'
import { getAIConfig } from '@/app/lib/aiConfig'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
})

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

interface ResumeManagerProps {
  onSelectResume?: (id: string) => void
  selectedResumeId?: string
}

interface EditState {
  text: string
  saving: boolean
  saved: boolean
  formatting: boolean
  error: string | null
}

export default function ResumeManager({ onSelectResume, selectedResumeId }: ResumeManagerProps) {
  const { t } = useLocale()
  const { data, error, isLoading, mutate } = useSWR<Resume[]>('/api/resumes', fetcher, {
    revalidateOnFocus: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editStates, setEditStates] = useState<Record<string, EditState>>({})

  const resumes = data ?? []

  const toggleExpand = (resume: Resume) => {
    if (expandedId === resume.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(resume.id)
    setEditStates(prev => ({
      ...prev,
      [resume.id]: prev[resume.id] ?? { text: resume.text, saving: false, saved: false, formatting: false, error: null },
    }))
  }

  const formatWithAI = async (resume: Resume) => {
    const cfg = getAIConfig()
    if (!cfg?.apiKey) return
    const state = editStates[resume.id]
    if (!state) return
    setEditStates(prev => ({ ...prev, [resume.id]: { ...state, formatting: true, error: null } }))
    try {
      const res = await fetch(`/api/resumes/${resume.id}/format`, {
        method: 'POST',
        headers: {
          'X-AI-Key': cfg.apiKey,
          'X-AI-Provider': cfg.provider,
          'X-AI-Model': cfg.model,
          'X-AI-Reasoning': String(cfg.reasoning),
        },
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText)
      const { text } = await res.json() as { text: string }
      setEditStates(prev => ({ ...prev, [resume.id]: { ...prev[resume.id]!, text, formatting: false, saved: false } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setEditStates(prev => ({ ...prev, [resume.id]: { ...prev[resume.id]!, formatting: false, error: msg } }))
    }
  }

  const saveText = async (resume: Resume) => {
    const state = editStates[resume.id]
    if (!state) return
    setEditStates(prev => ({ ...prev, [resume.id]: { ...state, saving: true, error: null } }))
    try {
      const res = await fetch(`/api/resumes/${resume.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: resume.name, text: state.text }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText)
      await mutate()
      setEditStates(prev => ({ ...prev, [resume.id]: { ...state, text: state.text, saving: false, saved: true, error: null } }))
      setTimeout(() => setEditStates(prev => ({ ...prev, [resume.id]: { ...prev[resume.id]!, saved: false } })), 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setEditStates(prev => ({ ...prev, [resume.id]: { ...state, saving: false, error: msg } }))
    }
  }

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
                const isExpanded = expandedId === resume.id
                const editState = editStates[resume.id]
                const isDirty = editState && editState.text !== resume.text
                return (
                  <div
                    key={resume.id}
                    className={`rounded-lg border transition-all ${
                      isSelected
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      {/* PDF icon */}
                      <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{resume.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {resume.text.length.toLocaleString()} {t('characters')} &middot;{' '}
                          {new Date(resume.uploadedAt).toLocaleDateString('en-CA')}
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

                      {/* View/edit toggle */}
                      <button
                        onClick={() => toggleExpand(resume)}
                        className={`shrink-0 p-1 rounded transition-colors ${
                          isExpanded
                            ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                        title={isExpanded ? t('close') : t('resumeViewText')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={isExpanded
                              ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                              : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'}
                          />
                        </svg>
                      </button>

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

                    {/* Expanded text editor */}
                    {isExpanded && editState && (
                      <div className="border-t border-zinc-100 dark:border-zinc-700 px-3 pb-3 pt-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('resumeExtractedText')}</p>
                          <button
                            onClick={() => formatWithAI(resume)}
                            disabled={editState.formatting || !getAIConfig()?.apiKey}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-40 transition-colors"
                          >
                            {editState.formatting ? (
                              <>
                                <span className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-indigo-500 animate-spin" />
                                {t('resumeFormatting')}
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                {t('resumeFormatWithAI')}
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          rows={12}
                          value={editState.text}
                          onChange={e => setEditStates(prev => ({
                            ...prev,
                            [resume.id]: { ...prev[resume.id]!, text: e.target.value, saved: false },
                          }))}
                          className={textareaField}
                          spellCheck={false}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveText(resume)}
                            disabled={!isDirty || editState.saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors"
                          >
                            {editState.saving ? t('saving') : t('save')}
                          </button>
                          {editState.saved && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('profileSaved')}</span>
                          )}
                          {editState.error && (
                            <span className="text-xs text-red-500">{editState.error}</span>
                          )}
                          {isDirty && !editState.saving && (
                            <button
                              onClick={() => setEditStates(prev => ({
                                ...prev,
                                [resume.id]: { ...prev[resume.id]!, text: resume.text },
                              }))}
                              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                              {t('cancel')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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
