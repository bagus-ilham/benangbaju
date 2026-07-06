'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { Eye, Truck } from 'lucide-react'
import { Button, TableSkeleton } from '@/shared/components'
import type { AdminOrderListItem } from '@/modules/orders/types'

interface AdminOrdersTableProps {
  orders: AdminOrderListItem[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onOpenQuickResi: (order: AdminOrderListItem) => void
}

export function AdminOrdersTable({
  orders,
  isLoading,
  isError,
  onRefetch,
  onOpenQuickResi,
}: AdminOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 bg-white border border-neutral-200">
        <TableSkeleton columns={6} rows={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat daftar pesanan</p>
        <Button
          onClick={onRefetch}
          variant="outline"
          className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block"
        >
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-400 italic text-xs">
        Tidak ada pesanan ditemukan.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
            <th className="py-3 px-5">No. Pesanan</th>
            <th className="py-3 px-4">Penerima</th>
            <th className="py-3 px-4 text-center">Total Belanja</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-neutral-50/20 transition duration-150">
              <td className="py-4 px-5">
                <span className="font-semibold text-neutral-900 block">{o.order_number}</span>
                <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                  Tgl Beli:{' '}
                  {new Date(o.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </td>
              <td className="py-4 px-4">
                <p>{o.order_shipping?.recipient_name || 'Pelanggan'}</p>
                <p className="text-[10px] text-neutral-400 font-normal">
                  {o.order_shipping?.courier_name} | {o.order_shipping?.phone}
                </p>
              </td>
              <td className="py-4 px-4 text-center font-bold text-neutral-900">
                Rp {o.total_amount.toLocaleString('id-ID')}
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 ${
                    o.status === 'completed'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : o.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                  }`}
                >
                  {o.status === 'pending_payment'
                    ? 'Belum Bayar'
                    : o.status === 'processing'
                      ? 'Diproses'
                      : o.status === 'shipped'
                        ? 'Dikirim'
                        : o.status === 'completed'
                          ? 'Selesai'
                          : 'Batal'}
                </span>
              </td>
              <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                {o.status === 'processing' && (
                  <Button
                    onClick={() => onOpenQuickResi(o)}
                    className="p-2 border-neutral-800 text-neutral-800 hover:bg-neutral-50 mr-1"
                    variant="outline"
                    title="Input Resi & Kirim"
                  >
                    <Truck size={13} className="mr-1 inline" /> Kirim
                  </Button>
                )}
                <Link href={`/admin/pesanan/${o.order_number}`}>
                  <Button
                    variant="outline"
                    className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                  >
                    <Eye size={13} className="mr-1 inline" /> Detail
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
