'use client'

import { useState } from 'react'
import JDTextManagement from '@/components/JDTextManagement'
import JDpage from '@/components/JDpage'

type Tab = 'jd-texts' | 'structured'

export default function ExtractPage() {
  const [tab, setTab] = useState<Tab>('jd-texts')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Extraction</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage raw job description texts and AI-extracted structured data.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-zinc-200 dark:border-zinc-700">
        {([
          { key: 'jd-texts' as Tab, label: 'JD Texts' },
          { key: 'structured' as Tab, label: 'Structured JDs' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        {tab === 'jd-texts' ? <JDTextManagement /> : <JDpage />}
      </div>
    </div>
  )
}
