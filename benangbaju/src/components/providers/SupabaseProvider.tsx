'use client'

import React, { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
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
            .select('*')
            .eq('id', user.id)
            .single()

          if (profile) {
            setProfile({
              ...profile,
              role: profile.role as 'customer' | 'admin',
            })
          }

          // Sync cart and wishlist with database
          useCartStore.getState().syncCart(user.id, true)
          useWishlistStore.getState().syncWishlist(user.id)
        } else {
          clearAuth()
          useWishlistStore.getState().clearWishlist()
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setProfile({
            ...profile,
            role: profile.role as 'customer' | 'admin',
          })
        }

        // Sync cart and wishlist with database
        useCartStore.getState().syncCart(session.user.id, true)
        useWishlistStore.getState().syncWishlist(session.user.id)
      } else {
        clearAuth()
        useWishlistStore.getState().clearWishlist()
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setProfile, setLoading, clearAuth])

  return <>{children}</>
}
