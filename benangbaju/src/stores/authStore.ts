import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  name: string
  phone: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, profile: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'benangbaju-auth',
      // Only persist isAuthenticated. Reset isLoading on reload.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
