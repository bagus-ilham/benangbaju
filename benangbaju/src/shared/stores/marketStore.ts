'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useHydrated } from '@/shared/hooks/useHydrated'

export type Market = 'ID' | 'MY'

interface MarketState {
  market: Market
  isHydrated: boolean
  setMarket: (market: Market) => void
  syncFromCookie: () => void
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
}

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      market: 'ID',
      isHydrated: false,
      setMarket: (market: Market) => {
        set({ market })
        setCookie('bb_market', market)
      },
      syncFromCookie: () => {
        // 1. Check URL query param ?market= (e.g. from Meta/TikTok Ads campaign link)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const urlMarket = urlParams.get('market')?.toUpperCase()
          if (urlMarket === 'ID' || urlMarket === 'MY') {
            set({ market: urlMarket as Market, isHydrated: true })
            setCookie('bb_market', urlMarket)
            return
          }
        }

        // 2. Fallback to bb_market cookie
        const cookieVal = getCookie('bb_market')?.toUpperCase()
        if (cookieVal === 'ID' || cookieVal === 'MY') {
          set({ market: cookieVal as Market, isHydrated: true })
        } else {
          setCookie('bb_market', get().market)
          set({ isHydrated: true })
        }
      },
    }),
    {
      name: 'benangbaju-market',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ market: state.market }),
      onRehydrateStorage: () => (state) => {
        state?.syncFromCookie()
      },
    }
  )
)

/**
 * Hydration-safe market hook.
 * Returns 'ID' during SSR and initial client hydration, then returns the persisted client market.
 * This guarantees zero hydration mismatches across components that render conditionally by market.
 */
export function useMarket(): Market {
  const isHydrated = useHydrated()
  const market = useMarketStore((state) => state.market)
  return isHydrated ? market : 'ID'
}
