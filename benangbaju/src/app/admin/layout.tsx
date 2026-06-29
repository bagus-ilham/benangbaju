import React, { Suspense } from 'react'
import { AdminLayout } from '@/components/layout'

export default function Layout({ children }: { children: React.ReactNode }) : React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading admin...</div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  )
}
