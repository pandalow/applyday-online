'use client'

import { useState } from 'react'
import { useLocale } from '@/locales'
import type { JobDescription } from '@/components/types'

interface JDitemProps {
  jd: JobDescription
  onDelete: (id: string) => void
}

const LEVEL_BADGE: Record<string, string> = {
  intern:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  junior:  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  mid:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  senior:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  lead:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  manager: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
}
const REMOTE_BADGE: Record<string, string> = {
  remote:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  hybrid:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'on-site': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {children}
    </div>
  )
}

export default function JDitem({ jd, onDelete }: JDitemProps) {
  const { t } = useLocale()
  const [expanded, setExpanded] = useState(false)

  const handleDelete = () => {
    if (window.confirm(t('deleteConfirm'))) {
      onDelete(jd.id)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900 dark:text-white truncate">
              {jd.role ?? '—'}
            </span>
            {jd.level && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_BADGE[jd.level] ?? 'bg-zinc-100 text-zinc-700'}`}>
                {jd.level}
              </span>
            )}
            {jd.remoteWork && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REMOTE_BADGE[jd.remoteWork] ?? 'bg-zinc-100 text-zinc-700'}`}>
                {jd.remoteWork}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
            {jd.company && <span>{jd.company}</span>}
            {jd.company && jd.location && <span className="text-zinc-300 dark:text-zinc-600">·</span>}
            {jd.location && <span>{jd.location}</span>}
            {jd.employmentType && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="capitalize">{jd.employmentType.replace('_', ' ')}</span>
              </>
            )}
          </div>
          {/* Salary */}
          {(jd.salaryEurMin || jd.salaryEurMax) && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t('salaryRange')}: €{jd.salaryEurMin?.toLocaleString() ?? '?'}
              {jd.salaryEurMax ? ` – €${jd.salaryEurMax.toLocaleString()}` : '+'}
            </p>
          )}
        </div>

        {/* Expand chevron */}
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 mt-1 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-100 dark:border-zinc-700 pt-4">
          {/* Skills grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {jd.requiredCoreSkills?.length ? (
              <Section label={t('requiredSkills')}>
                <TagList items={jd.requiredCoreSkills} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" />
              </Section>
            ) : null}

            {jd.desirableSkills?.length ? (
              <Section label={t('desirableSkills')}>
                <TagList items={jd.desirableSkills} color="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" />
              </Section>
            ) : null}

            {jd.programmingLanguages?.length ? (
              <Section label={t('programmingLanguages')}>
                <TagList items={jd.programmingLanguages} color="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />
              </Section>
            ) : null}

            {jd.frameworksTools?.length ? (
              <Section label={t('frameworksTools')}>
                <TagList items={jd.frameworksTools} color="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" />
              </Section>
            ) : null}

            {jd.databases?.length ? (
              <Section label={t('databases')}>
                <TagList items={jd.databases} color="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" />
              </Section>
            ) : null}

            {jd.cloudPlatforms?.length ? (
              <Section label={t('cloudPlatforms')}>
                <TagList items={jd.cloudPlatforms} color="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" />
              </Section>
            ) : null}
          </div>

          {/* Benefits */}
          {jd.benefits?.length ? (
            <Section label={t('benefits')}>
              <ul className="list-disc list-inside space-y-0.5">
                {jd.benefits.map((b, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{b}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* Responsibilities */}
          {jd.responsibilities?.length ? (
            <Section label={t('responsibilities')}>
              <ul className="list-disc list-inside space-y-0.5">
                {jd.responsibilities.slice(0, 5).map((r, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{r}</li>
                ))}
                {jd.responsibilities.length > 5 && (
                  <li className="text-xs text-zinc-400 dark:text-zinc-500 list-none pl-4">
                    +{jd.responsibilities.length - 5} more…
                  </li>
                )}
              </ul>
            </Section>
          ) : null}

          {/* Delete */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleDelete}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
