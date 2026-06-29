import React, { Suspense } from 'react'
import OrderDetailPageClient from './OrderDetailClient'

interface OrderDetailPageProps {
  params: {
    orderNumber: string
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = await params
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading order...</div>}>
      <OrderDetailPageClient params={resolvedParams} />
    </Suspense>
  )
}
