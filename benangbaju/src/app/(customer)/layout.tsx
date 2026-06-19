import React from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'

export default function CustomerGroupLayout({
  children,
}: {
  children: React.ReactNode
}) : React.JSX.Element {
  return <CustomerLayout>{children}</CustomerLayout>
}
