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
        <span className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full text-brand-plum bg-brand-gold-soft/80 border border-brand-gold-stroke/60 animate-pulse-glow">
          <HandDrawnIcon name="clock" className="h-3 w-3 mr-1.5" />{' '}
          {isMY ? 'Pending Payment' : 'Menunggu Pembayaran'}
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full text-brand-plum bg-brand-blue-soft border border-brand-blue-stroke">
          <HandDrawnIcon name="package" className="h-3 w-3 mr-1.5" />{' '}
          {isMY ? 'Processing' : 'Diproses'}
        </span>
      )
    case 'shipped':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full text-brand-plum bg-brand-blue-soft border border-brand-blue-stroke">
          <HandDrawnIcon name="truck" className="h-3 w-3 mr-1.5" />{' '}
          {isMY ? 'Shipped' : 'Dikirim'}
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200">
          <HandDrawnIcon name="check-circle" className="h-3 w-3 mr-1.5" />{' '}
          {isMY ? 'Completed' : 'Selesai'}
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full text-neutral-600 bg-neutral-100 border border-neutral-200">
          <HandDrawnIcon name="close" className="h-3 w-3 mr-1.5" />{' '}
          {isMY ? 'Cancelled' : 'Dibatalkan'}
        </span>
      )
    default:
      return null
  }
}
