'use client'

import React, { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/entities/user/model/authStore'
import { useCartStore } from '@/entities/cart/model/cartStore'
import { useWishlistStore } from '@/features/products/stores/wishlistStore'

import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function SupabaseProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const supabase = createBrowserClient()
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    // 1. Check current session immediately on load
    const syncSession = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser(user)

          // Fetch profile details
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, phone, avatar_url, role, is_active, created_at, updated_at')
            .eq('id', user.id)
            .single()

          if (profile) {
            const role = profile.role === 'admin' ? 'admin' : 'customer'
            setProfile({
              ...profile,
              role,
            })
          }

          // Sync cart and wishlist with database
          useCartStore.getState().syncCart(user.id, true)
          useWishlistStore.getState().syncWishlist(user.id)
        } else {
          clearAuth()
          useWishlistStore.getState().clearWishlist()
          useCartStore.getState().resetCart()
        }
      } catch (error) {
        console.error('Error syncing Supabase session:', error)
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
      if (session?.user) {
        setUser(session.user)

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, phone, avatar_url, role, is_active, created_at, updated_at')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const role = profile.role === 'admin' ? 'admin' : 'customer'
          setProfile({
            ...profile,
            role,
          })
        }

        // Sync cart and wishlist with database
        useCartStore.getState().syncCart(session.user.id, true)
        useWishlistStore.getState().syncWishlist(session.user.id)
      } else {
        clearAuth()
        useWishlistStore.getState().clearWishlist()
        useCartStore.getState().resetCart()
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setProfile, setLoading, clearAuth])

  return <>{children}</>
}
