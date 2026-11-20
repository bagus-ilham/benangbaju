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
              background: 'var(--color-brand-cream)',
              color: 'var(--color-brand-plum)',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: '12px',
              border: '1px solid var(--color-brand-blue-stroke)',
              padding: '12px 20px',
              boxShadow: '0 4px 20px rgba(45, 38, 64, 0.08)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-brand-plum)',
                secondary: 'var(--color-brand-cream)',
              },
              style: {
                borderLeft: '3px solid var(--color-brand-blue-text)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-error)',
                secondary: 'var(--color-brand-cream)',
              },
              style: {
                borderLeft: '3px solid var(--color-error)',
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
