'use client'

import React, { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'

import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { safeLogError } from '@/lib/logger'

export function SupabaseProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const supabase = createBrowserClient()
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    const handleUserSession = async (user: User | null) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, phone, avatar_url, role, is_active, created_at, updated_at')
          .eq('id', user.id)
          .single()

        if (profile) {
          const role = profile.role === 'admin' ? 'admin' : 'customer'
          setProfile({ ...profile, role })
        }

        useCartStore.getState().syncCart(user.id, true)
        useWishlistStore.getState().syncWishlist(user.id)
      } else {
        clearAuth()
        useWishlistStore.getState().clearWishlist()
        useCartStore.getState().resetCart()
      }
    }

    // 1. Check current session immediately on load
    const syncSession = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        await handleUserSession(user)
      } catch (error) {
        safeLogError('Error syncing Supabase session:', error)
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    syncSession()

    // 2. Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      await handleUserSession(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setProfile, setLoading, clearAuth])

  return <>{children}</>
}
