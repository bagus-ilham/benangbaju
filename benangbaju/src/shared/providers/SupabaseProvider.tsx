'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'

import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { safeLogError } from '@/lib/logger'

export function SupabaseProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    let lastUserId: string | null | undefined = undefined

    const handleUserSession = async (user: User | null) => {
      const currentUserId = user?.id ?? null

      if (user) {
        setUser(user)

        if (lastUserId !== currentUserId) {
          lastUserId = currentUserId

          // Set loading to false immediately so auth state is available without waiting on profile query
          setLoading(false)

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, phone, avatar_url, role, is_active, created_at, updated_at')
              .eq('id', user.id)
              .maybeSingle()

            if (profile) {
              const role = profile.role === 'admin' ? 'admin' : 'customer'
              setProfile({ ...profile, role })
            } else {
              setProfile({
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                phone: user.phone || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                role: 'customer',
                is_active: true,
                created_at: user.created_at,
                updated_at: user.created_at,
              })
            }
          } catch (err) {
            safeLogError('Error fetching user profile:', err)
          }

          // Background non-blocking sync for cart & wishlist
          Promise.all([
            useCartStore.getState().syncCart(user.id, true),
            useWishlistStore.getState().syncWishlist(user.id),
          ]).catch((err) => safeLogError('Error syncing cart/wishlist:', err))
        } else {
          setLoading(false)
        }
      } else {
        if (lastUserId !== null) {
          lastUserId = null
          clearAuth()
          useWishlistStore.getState().clearWishlist()
          useCartStore.getState().resetCart()
        }
        setLoading(false)
      }
    }

    setLoading(true)

    // Single source of truth: onAuthStateChange handles initial session + changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') {
        setLoading(false)
        router.push('/reset-password')
        return
      }
      // Execute asynchronously so Supabase subscriber queue is never blocked
      setTimeout(() => {
        handleUserSession(session?.user ?? null)
      }, 0)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, setUser, setProfile, setLoading, clearAuth])

  return <>{children}</>
}
