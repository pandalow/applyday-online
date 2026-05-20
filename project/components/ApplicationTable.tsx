'use client'

import { Fragment, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useLocale } from '@/locales'
import { STATUS_OPTIONS, STATUS_COLORS } from '@/components/applicationStatus'
import { formatDate } from '@/app/lib/formatDate'
import ApplicationDetail from '@/components/ApplicationDetail'
import type { Application } from '@/components/types'

type EditField = 'company' | 'jobTitle' | 'applicationDate' | 'channel'
type EditTarget = { id: string; field: EditField } | null
type NotesModal = { id: string; value: string } | null
type NewRow = { company: string; jobTitle: string; status: string; applicationDate: string; channel: string; jd: string }

export interface ApplicationTableHandle {
  addRow: () => void
}

interface Props {
  applications: Application[]
  onUpdate: (id: string, changes: Partial<Application>) => Promise<void>
  onCreate: (data: Omit<Application, 'id' | 'createdAt'>) => Promise<string | null>
  onDelete: (id: string) => Promise<void>
}

// Shared input styles for editable cells
const INPUT_CLS = 'w-full px-2 py-1 rounded border border-indigo-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500'
const HOVER_CLS = 'block px-2 py-1 rounded cursor-text hover:bg-indigo-50 dark:hover:bg-indigo-900/20 truncate'

interface EditableCellProps {
  isEditing: boolean
  value: string
  displayClass?: string
  title?: string
  onStartEdit: () => void
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}

function EditableTextCell({ isEditing, value, displayClass = '', title, onStartEdit, onChange, onCommit, onCancel }: EditableCellProps) {
  return isEditing ? (
    <input
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e => {
        if (e.key === 'Enter') onCommit()
        if (e.key === 'Escape') onCancel()
      }}
      className={INPUT_CLS}
    />
  ) : (
    <span onClick={onStartEdit} className={`${HOVER_CLS} ${displayClass}`} title={title}>
      {value}
    </span>
  )
}

const ApplicationTable = forwardRef<ApplicationTableHandle, Props>(
  function ApplicationTable({ applications, onUpdate, onCreate, onDelete }, ref) {
    const { t } = useLocale()

    const [editing, setEditing] = useState<EditTarget>(null)
    const [editValue, setEditValue] = useState('')
    const [notesModal, setNotesModal] = useState<NotesModal>(null)
    const [newRow, setNewRow] = useState<NewRow | null>(null)
    const [saving, setSaving] = useState<Set<string>>(new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({ addRow: startNewRow }))

    const isSaving = (id: string) => saving.has(id)
    const setSavingId = (id: string) => setSaving(s => new Set(s).add(id))
    const clearSavingId = (id: string) => setSaving(s => { const n = new Set(s); n.delete(id); return n })

    const commitEdit = useCallback(async (id: string, field: EditField, value: string, original: string) => {
      setEditing(null)
      const trimmed = value.trim()
      if (trimmed === original) return
      if ((field === 'company' || field === 'jobTitle') && !trimmed) return
      setSavingId(id)
      await onUpdate(id, { [field]: trimmed || undefined })
      clearSavingId(id)
    }, [onUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleStatusChange = async (id: string, status: string) => {
      setSavingId(id)
      await onUpdate(id, { status })
      clearSavingId(id)
    }

    const saveNotes = async () => {
      if (!notesModal) return
      const original = applications.find(a => a.id === notesModal.id)?.stageNotes ?? ''
      setNotesModal(null)
      if (notesModal.value === original) return
      setSavingId(notesModal.id)
      await onUpdate(notesModal.id, { stageNotes: notesModal.value || undefined })
      clearSavingId(notesModal.id)
    }

    function startNewRow() {
      setNewRow({
        company: '',
        jobTitle: '',
        status: 'prepared',
        applicationDate: new Date().toISOString().split('T')[0],
        channel: '',
        jd: '',
      })
    }

    const commitNewRow = async () => {
      if (!newRow || !newRow.company.trim() || !newRow.jobTitle.trim()) return
      setSavingId('new')
      const appId = await onCreate({
        company: newRow.company.trim(),
        jobTitle: newRow.jobTitle.trim(),
        status: newRow.status,
        applicationDate: newRow.applicationDate,
        channel: newRow.channel.trim() || undefined,
        stageNotes: undefined,
      })
      if (appId && newRow.jd.trim()) {
        await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newRow.jd.trim(), applicationId: appId }),
        })
      }
      clearSavingId('new')
      setNewRow(null)
    }

    const handleNewRowKey = (e: React.KeyboardEvent, field: 'company' | 'jobTitle') => {
      if (e.key === 'Escape') { setNewRow(null); return }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (field === 'company') document.getElementById('new-row-jobTitle')?.focus()
        else commitNewRow()
      }
    }

    useEffect(() => {
      if (!notesModal) return
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setNotesModal(null) }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }, [notesModal])

    const thCls = 'px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide'

    return (
      <div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
                <th className={`${thCls} w-[18%]`}>{t('company')}</th>
                <th className={`${thCls} w-[18%]`}>{t('jobTitle')}</th>
                <th className={`${thCls} w-[11%]`}>{t('channel')}</th>
                <th className={`${thCls} w-[12%]`}>{t('status')}</th>
                <th className={`${thCls} w-[12%]`}>{t('applicationDate')}</th>
                <th className={thCls}>{t('stageNotes')}</th>
                <th className="w-16" />
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
              {applications.map(app => (
                <Fragment key={app.id}>
                <tr
                  className={`group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${isSaving(app.id) ? 'opacity-50' : ''} ${expandedId === app.id ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                >
                  <td className="px-2 py-1.5">
                    <EditableTextCell
                      isEditing={editing?.id === app.id && editing.field === 'company'}
                      value={editing?.id === app.id && editing.field === 'company' ? editValue : app.company}
                      displayClass="font-medium text-zinc-900 dark:text-white"
                      title={app.company}
                      onStartEdit={() => { setEditing({ id: app.id, field: 'company' }); setEditValue(app.company) }}
                      onChange={setEditValue}
                      onCommit={() => commitEdit(app.id, 'company', editValue, app.company)}
                      onCancel={() => setEditing(null)}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    <EditableTextCell
                      isEditing={editing?.id === app.id && editing.field === 'jobTitle'}
                      value={editing?.id === app.id && editing.field === 'jobTitle' ? editValue : app.jobTitle}
                      displayClass="text-zinc-600 dark:text-zinc-300"
                      title={app.jobTitle}
                      onStartEdit={() => { setEditing({ id: app.id, field: 'jobTitle' }); setEditValue(app.jobTitle) }}
                      onChange={setEditValue}
                      onCommit={() => commitEdit(app.id, 'jobTitle', editValue, app.jobTitle)}
                      onCancel={() => setEditing(null)}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    <EditableTextCell
                      isEditing={editing?.id === app.id && editing.field === 'channel'}
                      value={editing?.id === app.id && editing.field === 'channel' ? editValue : (app.channel ?? '')}
                      displayClass="text-zinc-500 dark:text-zinc-400 text-xs"
                      title={app.channel ?? ''}
                      onStartEdit={() => { setEditing({ id: app.id, field: 'channel' }); setEditValue(app.channel ?? '') }}
                      onChange={setEditValue}
                      onCommit={() => commitEdit(app.id, 'channel', editValue, app.channel ?? '')}
                      onCancel={() => setEditing(null)}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    <select
                      value={app.status}
                      onChange={e => handleStatusChange(app.id, e.target.value)}
                      disabled={isSaving(app.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLORS[app.status] ?? STATUS_COLORS.prepared}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{t(s as Parameters<typeof t>[0])}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-2 py-1.5">
                    {editing?.id === app.id && editing.field === 'applicationDate' ? (
                      <input
                        autoFocus
                        type="date"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(app.id, 'applicationDate', editValue, app.applicationDate?.split('T')[0] ?? '')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit(app.id, 'applicationDate', editValue, app.applicationDate?.split('T')[0] ?? '')
                          if (e.key === 'Escape') setEditing(null)
                        }}
                        className="px-2 py-1 rounded border border-indigo-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditing({ id: app.id, field: 'applicationDate' })
                          setEditValue(app.applicationDate?.split('T')[0] ?? new Date().toISOString().split('T')[0])
                        }}
                        className="block px-2 py-1 rounded cursor-text hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap"
                      >
                        {formatDate(app.applicationDate)}
                      </span>
                    )}
                  </td>

                  <td className="px-2 py-1.5 max-w-xs">
                    <button
                      onClick={() => setNotesModal({ id: app.id, value: app.stageNotes ?? '' })}
                      className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group/notes transition-colors"
                    >
                      {app.stageNotes ? (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex-1">{app.stageNotes}</span>
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-600 italic flex-1">Add notes…</span>
                      )}
                      <svg className="shrink-0 w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover/notes:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </td>

                  <td className="px-1 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setExpandedId(id => id === app.id ? null : app.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                        aria-label="Toggle detail"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedId === app.id ? 'rotate-180 text-indigo-500' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { if (window.confirm(t('deleteConfirm'))) onDelete(app.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        aria-label={t('delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === app.id && (
                  <tr key={`${app.id}-detail`}>
                    <td colSpan={7} className="p-0 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/5">
                      <ApplicationDetail applicationId={app.id} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}

              {newRow && (
                <>
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                    <td className="px-2 py-1.5">
                      <input
                        autoFocus
                        value={newRow.company}
                        onChange={e => setNewRow(r => r && { ...r, company: e.target.value })}
                        onKeyDown={e => handleNewRowKey(e, 'company')}
                        placeholder="Company *"
                        className={`${INPUT_CLS} placeholder-zinc-300 dark:placeholder-zinc-600`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        id="new-row-jobTitle"
                        value={newRow.jobTitle}
                        onChange={e => setNewRow(r => r && { ...r, jobTitle: e.target.value })}
                        onKeyDown={e => handleNewRowKey(e, 'jobTitle')}
                        placeholder="Job Title *"
                        className={`${INPUT_CLS} placeholder-zinc-300 dark:placeholder-zinc-600`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={newRow.channel}
                        onChange={e => setNewRow(r => r && { ...r, channel: e.target.value })}
                        placeholder="e.g. LinkedIn"
                        list="channel-suggestions"
                        className={`${INPUT_CLS} placeholder-zinc-300 dark:placeholder-zinc-600`}
                      />
                      <datalist id="channel-suggestions">
                        <option value="LinkedIn" />
                        <option value="Indeed" />
                        <option value="Boss直聘" />
                        <option value="猎聘" />
                        <option value="智联招聘" />
                        <option value="内推" />
                        <option value="官网" />
                        <option value="Referral" />
                      </datalist>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={newRow.status}
                        onChange={e => setNewRow(r => r && { ...r, status: e.target.value })}
                        className="px-2 py-1 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s as Parameters<typeof t>[0])}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={newRow.applicationDate}
                        onChange={e => setNewRow(r => r && { ...r, applicationDate: e.target.value })}
                        className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5" colSpan={2}>
                      <div className="flex items-center gap-2 px-1">
                        <button
                          onClick={commitNewRow}
                          disabled={!newRow.company.trim() || !newRow.jobTitle.trim() || isSaving('new')}
                          className="px-3 py-1 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                        >
                          {isSaving('new') ? '…' : 'Add'}
                        </button>
                        <button
                          onClick={() => setNewRow(null)}
                          className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-indigo-50/30 dark:bg-indigo-900/5">
                    <td colSpan={7} className="px-3 pb-3 pt-1">
                      <textarea
                        value={newRow.jd}
                        onChange={e => setNewRow(r => r && { ...r, jd: e.target.value })}
                        rows={3}
                        placeholder="Paste job description (optional) — save it with the application, extract key info later with AI"
                        className="w-full rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-500 resize-y focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {!newRow && (
            <button
              onClick={startNewRow}
              className="w-full flex items-center gap-2 px-5 py-2.5 text-sm text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors border-t border-zinc-100 dark:border-zinc-700/60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add application
            </button>
          )}
        </div>

        {notesModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setNotesModal(null)}
          >
            <div
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-5 space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t('stageNotes')}</h3>
                <button onClick={() => setNotesModal(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                autoFocus
                value={notesModal.value}
                onChange={e => setNotesModal(m => m && { ...m, value: e.target.value })}
                rows={6}
                placeholder="Notes about this stage…"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setNotesModal(null)} className="px-3 py-1.5 rounded-md text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  disabled={isSaving(notesModal.id)}
                  className="px-3 py-1.5 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving(notesModal.id) ? '…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

export default ApplicationTable
