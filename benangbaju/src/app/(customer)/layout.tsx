import React, { Suspense } from 'react'
import { CustomerLayout } from '@/shared/components/CustomerLayout'

export default function CustomerGroupLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <CustomerLayout>{children}</CustomerLayout>
    </Suspense>
  )
}
