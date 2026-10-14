'use client'

import { useSyncExternalStore } from 'react'
import { getAIConfig } from '@/app/lib/aiConfig'

const subscribe = () => () => {}

// localStorage is client-only: assume configured during SSR so the warning never flashes.
export function useAiConfigured() {
  return useSyncExternalStore(subscribe, () => !!getAIConfig()?.apiKey, () => true)
}
