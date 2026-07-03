import React, { Suspense } from 'react'
import { AdminLayout } from '@/shared/components/AdminLayout'
import AdminLoading from './loading'

export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  )
}
