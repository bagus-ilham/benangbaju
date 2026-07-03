'use client'

import React from 'react'
import { QueryProvider } from './QueryProvider'
import { SupabaseProvider } from './SupabaseProvider'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <QueryProvider>
      <SupabaseProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#ffffff',
              color: '#171717',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: '0px',
              border: '1px solid #e5e5e5',
              padding: '12px 20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            },
            success: {
              iconTheme: {
                primary: '#171717',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '3px solid #171717',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '3px solid #ef4444',
              },
            },
          }}
        />
      </SupabaseProvider>
    </QueryProvider>
  )
}

export { QueryProvider } from './QueryProvider'
export { SupabaseProvider } from './SupabaseProvider'
