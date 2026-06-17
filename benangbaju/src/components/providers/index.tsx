'use client'

import React from 'react'
import { QueryProvider } from './QueryProvider'
import { SupabaseProvider } from './SupabaseProvider'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SupabaseProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1c1c1c',
              color: '#fff',
              fontSize: '0.875rem',
              borderRadius: '0px', // THENBLANK style sharp corners
              padding: '12px 24px',
            },
          }}
        />
      </SupabaseProvider>
    </QueryProvider>
  )
}

export { QueryProvider } from './QueryProvider'
export { SupabaseProvider } from './SupabaseProvider'
