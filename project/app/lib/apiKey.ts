const STORAGE_KEY = 'applyday_openai_key'

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY) || null
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}
