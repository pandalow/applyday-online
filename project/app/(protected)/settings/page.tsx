'use client'

import { useState, useEffect } from 'react'
import {
  getAllAISettings,
  saveProviderConfig,
  activateProvider,
  clearProviderConfig,
  migrateApiKey,
  PROVIDER_MODELS,
  PROVIDER_LABELS,
  type AIProvider,
  type ProviderConfig,
} from '@/app/lib/aiConfig'

const PROVIDERS = Object.keys(PROVIDER_LABELS) as AIProvider[]

const KEY_PLACEHOLDERS: Record<AIProvider, string> = {
  openai: 'sk-proj-...',
  claude: 'sk-ant-...',
  deepseek: 'sk-...',
  gemini: 'AIza...',
}

const KEY_LINKS: Record<AIProvider, string> = {
  openai: 'https://platform.openai.com/api-keys',
  claude: 'https://console.anthropic.com/settings/keys',
  deepseek: 'https://platform.deepseek.com/api_keys',
  gemini: 'https://aistudio.google.com/app/apikey',
}

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState<AIProvider>('openai')
  const [configs, setConfigs] = useState<Partial<Record<AIProvider, ProviderConfig>>>({})
  const [tab, setTab] = useState<AIProvider>('openai')
  const [savedTab, setSavedTab] = useState<AIProvider | null>(null)

  useEffect(() => {
    migrateApiKey()
    const s = getAllAISettings()
    setActiveProvider(s.activeProvider)
    setConfigs(s.configs)
    setTab(s.activeProvider)
  }, [])

  const tabCfg = configs[tab] ?? { apiKey: '', model: PROVIDER_MODELS[tab][0].id, reasoning: false }

  const updateTabCfg = (patch: Partial<ProviderConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [tab]: { ...tabCfg, ...patch },
    }))
  }

  const currentModels = PROVIDER_MODELS[tab]
  const currentModel = currentModels.find(m => m.id === tabCfg.model) ?? currentModels[0]
  const canReason = currentModel?.supportsReasoning ?? false

  const handleSave = (andActivate: boolean) => {
    const cfg = { ...tabCfg, model: tabCfg.model || currentModels[0].id }
    saveProviderConfig(tab, cfg, andActivate)
    if (andActivate) setActiveProvider(tab)
    setSavedTab(tab)
    setTimeout(() => setSavedTab(null), 2000)
  }

  const handleClear = () => {
    clearProviderConfig(tab)
    setConfigs(prev => {
      const next = { ...prev }
      delete next[tab]
      return next
    })
    if (activeProvider === tab) setActiveProvider('openai')
  }

  const handleActivate = () => {
    activateProvider(tab)
    setActiveProvider(tab)
  }

  const isConfigured = (p: AIProvider) => !!(configs[p]?.apiKey?.trim())
  const isActive = (p: AIProvider) => p === activeProvider && isConfigured(p)

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure AI providers. You can save multiple providers and switch between them.
        </p>
      </div>

      {/* Active provider banner */}
      <div className={`rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm font-medium border ${
        isConfigured(activeProvider)
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
      }`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${isConfigured(activeProvider) ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        {isConfigured(activeProvider)
          ? <>Active: <span className="font-semibold">{PROVIDER_LABELS[activeProvider]}</span> · {configs[activeProvider]?.model}</>
          : 'No active AI provider — save a key below to get started'
        }
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Provider tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700">
          {PROVIDERS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setTab(p)}
              className={`flex-1 py-2.5 px-2 text-xs font-medium transition-colors relative ${
                tab === p
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-b-2 border-indigo-500 -mb-px'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {PROVIDER_LABELS[p]}
              {isActive(p) && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle" />
              )}
              {isConfigured(p) && !isActive(p) && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 align-middle" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {/* API Key */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              API Key
            </p>
            <input
              type="password"
              value={tabCfg.apiKey}
              onChange={e => updateTabCfg({ apiKey: e.target.value })}
              placeholder={KEY_PLACEHOLDERS[tab]}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Get your key at{' '}
              <a href={KEY_LINKS[tab]} target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {KEY_LINKS[tab].replace('https://', '')}
              </a>
            </p>
          </div>

          {/* Model selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Model</p>
            <div className="flex flex-wrap gap-2">
              {currentModels.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    updateTabCfg({ model: m.id, reasoning: m.supportsReasoning ? tabCfg.reasoning : false })
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    tabCfg.model === m.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}
                >
                  {m.label}
                  {m.supportsReasoning && <span className="ml-1 text-[10px] text-amber-500">✦</span>}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">✦ supports reasoning mode</p>
          </div>

          {/* Reasoning toggle */}
          <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
            canReason
              ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900'
              : 'border-zinc-100 dark:border-zinc-800 opacity-40'
          }`}>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reasoning mode</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Slower but more thorough. Only for ✦ models.</p>
            </div>
            <button
              type="button"
              disabled={!canReason}
              onClick={() => updateTabCfg({ reasoning: !tabCfg.reasoning })}
              className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed ${
                tabCfg.reasoning && canReason ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                tabCfg.reasoning && canReason ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {/* Save + activate (primary action) */}
            <button
              onClick={() => handleSave(true)}
              disabled={!tabCfg.apiKey?.trim()}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {savedTab === tab && activeProvider === tab ? '✓ Saved & Active' : 'Save & Use'}
            </button>

            {/* Save without activating (secondary) */}
            {activeProvider !== tab && (
              <button
                onClick={() => handleSave(false)}
                disabled={!tabCfg.apiKey?.trim()}
                className="px-4 py-2 rounded-md text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                {savedTab === tab ? '✓ Saved' : 'Save only'}
              </button>
            )}

            {/* Activate already-saved provider */}
            {isConfigured(tab) && activeProvider !== tab && (
              <button
                onClick={handleActivate}
                className="px-4 py-2 rounded-md text-sm font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                Use this provider
              </button>
            )}

            {/* Clear */}
            {isConfigured(tab) && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Note:</strong> Keys are stored in your browser&apos;s localStorage only — never sent to our servers outside of AI requests.
        </p>
      </div>
    </div>
  )
}
