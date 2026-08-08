import React from 'react'
import { HandDrawnIcon } from './HandDrawnIcon'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  type?: 'order' | 'review'
  className?: string
}

export function OrderStatusBadge({ status, className }: { status: string; className?: string }): React.JSX.Element {
  switch (status) {
    case 'pending_payment':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-amber-800 bg-amber-50 border border-amber-200 rounded-full animate-pulse-glow", className)}>
          <HandDrawnIcon name="clock" className="h-3 w-3 mr-1" /> Belum Bayar
        </span>
      )
    case 'processing':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-blue-800 bg-blue-50 border border-blue-200 rounded-full", className)}>
          <HandDrawnIcon name="package" className="h-3 w-3 mr-1" /> Diproses
        </span>
      )
    case 'shipped':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-full", className)}>
          <HandDrawnIcon name="truck" className="h-3 w-3 mr-1" /> Dikirim
        </span>
      )
    case 'completed':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-green-800 bg-green-50 border border-green-200 rounded-full", className)}>
          <HandDrawnIcon name="check-circle" className="h-3 w-3 mr-1" /> Selesai
        </span>
      )
    case 'cancelled':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-full", className)}>
          <HandDrawnIcon name="close" className="h-3 w-3 mr-1" /> Dibatalkan
        </span>
      )
    default:
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-full", className)}>
          {status}
        </span>
      )
  }
}

export function ReviewStatusBadge({ status, className }: { status: string; className?: string }): React.JSX.Element {
  switch (status) {
    case 'approved':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-green-700 bg-green-50 border border-green-200 rounded-full", className)}>
          Disetujui
        </span>
      )
    case 'hidden':
    case 'rejected':
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-red-700 bg-red-50 border border-red-200 rounded-full", className)}>
          {status === 'hidden' ? 'Disembunyikan' : 'Ditolak'}
        </span>
      )
    default:
      return (
        <span className={cn("inline-flex items-center text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full", className)}>
          Menunggu
        </span>
      )
  }
}

export function StatusBadge({ status, type = 'order', className }: StatusBadgeProps): React.JSX.Element {
  if (type === 'review') {
    return <ReviewStatusBadge status={status} className={className} />
  }
  return <OrderStatusBadge status={status} className={className} />
}
