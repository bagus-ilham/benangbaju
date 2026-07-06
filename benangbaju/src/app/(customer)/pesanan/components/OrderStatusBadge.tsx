import React from 'react'
import { Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react'

interface OrderStatusBadgeProps {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps): React.JSX.Element | null {
  switch (status) {
    case 'pending_payment':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-amber-800 bg-amber-50 border border-amber-200 animate-pulse-glow">
          <Clock size={12} className="mr-1" /> Menunggu Pembayaran
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-blue-800 bg-blue-50 border border-blue-200">
          <Package size={12} className="mr-1" /> Diproses
        </span>
      )
    case 'shipped':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-indigo-800 bg-indigo-50 border border-indigo-200">
          <Truck size={12} className="mr-1" /> Dikirim
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-green-800 bg-green-50 border border-green-200">
          <CheckCircle2 size={12} className="mr-1" /> Selesai
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-neutral-500 bg-neutral-50 border border-neutral-200">
          <XCircle size={12} className="mr-1" /> Dibatalkan
        </span>
      )
    default:
      return null
  }
}
