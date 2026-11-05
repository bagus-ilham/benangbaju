'use client'

import React from 'react'
import { HandDrawnIcon } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

interface OrderStatusBadgeProps {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps): React.JSX.Element | null {
  const market = useMarket()
  const isMY = market === 'MY'

  switch (status) {
    case 'pending_payment':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-amber-800 bg-amber-50 border border-amber-200 animate-pulse-glow">
          <HandDrawnIcon name="clock" className="h-3 w-3 mr-1" /> {isMY ? 'Pending Payment' : 'Menunggu Pembayaran'}
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-blue-800 bg-blue-50 border border-blue-200">
          <HandDrawnIcon name="package" className="h-3 w-3 mr-1" /> {isMY ? 'Processing' : 'Diproses'}
        </span>
      )
    case 'shipped':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-indigo-800 bg-indigo-50 border border-indigo-200">
          <HandDrawnIcon name="truck" className="h-3 w-3 mr-1" /> {isMY ? 'Shipped' : 'Dikirim'}
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-green-800 bg-green-50 border border-green-200">
          <HandDrawnIcon name="check-circle" className="h-3 w-3 mr-1" /> {isMY ? 'Completed' : 'Selesai'}
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-neutral-600 bg-neutral-50 border border-neutral-200">
          <HandDrawnIcon name="close" className="h-3 w-3 mr-1" /> {isMY ? 'Cancelled' : 'Dibatalkan'}
        </span>
      )
    default:
      return null
  }
}
