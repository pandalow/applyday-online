export type AIProvider = 'openai' | 'claude' | 'deepseek' | 'gemini'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  reasoning: boolean
}

export interface ProviderConfig {
  apiKey: string
  model: string
  reasoning: boolean
}

interface AISettings {
  activeProvider: AIProvider
  configs: Partial<Record<AIProvider, ProviderConfig>>
}

interface ModelOption {
  id: string
  label: string
  supportsReasoning?: boolean
}

export const PROVIDER_MODELS: Record<AIProvider, ModelOption[]> = {
  openai: [
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'o4-mini', label: 'o4-mini', supportsReasoning: true },
    { id: 'o3', label: 'o3', supportsReasoning: true },
  ],
  claude: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', supportsReasoning: true },
    { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', supportsReasoning: true },
  ],
  deepseek: [
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', supportsReasoning: true },
  ],
  gemini: [
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', supportsReasoning: true },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', supportsReasoning: true },
  ],
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
}

const STORAGE_KEY = 'applyday_ai_settings'

function loadSettings(): AISettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AISettings
  } catch {
    return null
  }
}

function saveSettings(settings: AISettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/** Returns the active provider's config, or null if nothing is configured. */
export function getAIConfig(): AIConfig | null {
  const s = loadSettings()
  if (!s) return null
  const cfg = s.configs[s.activeProvider]
  if (!cfg?.apiKey) return null
  return { provider: s.activeProvider, ...cfg }
}

/** Returns all stored settings (for the Settings page). */
export function getAllAISettings(): AISettings {
  return loadSettings() ?? { activeProvider: 'openai', configs: {} }
}

/** Save a provider's config and optionally activate it. */
export function saveProviderConfig(
  provider: AIProvider,
  cfg: ProviderConfig,
  activate: boolean,
): void {
  const s = getAllAISettings()
  s.configs[provider] = cfg
  if (activate) s.activeProvider = provider
  saveSettings(s)
}

/** Activate an already-saved provider. */
export function activateProvider(provider: AIProvider): void {
  const s = getAllAISettings()
  s.activeProvider = provider
  saveSettings(s)
}

/** Remove a provider's saved config. If it was active, falls back to openai. */
export function clearProviderConfig(provider: AIProvider): void {
  const s = getAllAISettings()
  delete s.configs[provider]
  if (s.activeProvider === provider) s.activeProvider = 'openai'
  saveSettings(s)
}

/** Legacy: migrate old single-key storage. */
export function migrateApiKey(): void {
  if (typeof window === 'undefined') return
  const old = localStorage.getItem('applyday_openai_key')
  if (!old) return
  if (localStorage.getItem(STORAGE_KEY)) return
  saveProviderConfig('openai', { apiKey: old, model: 'gpt-4o-mini', reasoning: false }, true)
  localStorage.removeItem('applyday_openai_key')

  // Also migrate old single-config format
  const oldCfg = localStorage.getItem('applyday_ai_config')
  if (oldCfg) {
    try {
      const parsed = JSON.parse(oldCfg) as AIConfig
      if (parsed.provider && parsed.apiKey) {
        saveProviderConfig(parsed.provider, {
          apiKey: parsed.apiKey,
          model: parsed.model,
          reasoning: parsed.reasoning,
        }, true)
      }
    } catch { /* ignore */ }
    localStorage.removeItem('applyday_ai_config')
  }
}
