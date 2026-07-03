import React, { Suspense } from 'react'
import ReturnPageClient from './ReturnClient'
import { AuthLoading } from '@/shared/components'

interface ReturnPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

export default async function ReturnPage({ params }: ReturnPageProps) {
  const resolvedParams = await params
  return (
    <Suspense fallback={<AuthLoading message="Memuat form retur..." />}>
      <ReturnPageClient params={resolvedParams} />
    </Suspense>
  )
}
