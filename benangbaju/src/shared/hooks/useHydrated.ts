'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Hook to detect whether the component has mounted and client-side hydration is complete.
 * Uses useSyncExternalStore to prevent hydration mismatch and cascading re-renders.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

