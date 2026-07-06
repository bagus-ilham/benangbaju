'use client'

import React from 'react'
import { Button, TableSkeleton } from '@/shared/components'
import type { AdminReturnRequestListItem } from '@/modules/orders/types'

interface AdminReturnsTableProps {
  returnsData: AdminReturnRequestListItem[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onOpenReturnModal: (ret: AdminReturnRequestListItem) => void
}

export function AdminReturnsTable({
  returnsData,
  isLoading,
  isError,
  onRefetch,
  onOpenReturnModal,
}: AdminReturnsTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 bg-white border border-neutral-200">
        <TableSkeleton columns={6} rows={3} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat pengajuan retur</p>
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

  if (returnsData.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-400 italic text-xs">
        Tidak ada pengajuan retur barang.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
            <th className="py-3 px-5">No. Pesanan</th>
            <th className="py-3 px-4">Pengaju</th>
            <th className="py-3 px-4">Alasan</th>
            <th className="py-3 px-4 text-center">Rencana Pengembalian</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
          {returnsData.map((ret: AdminReturnRequestListItem) => (
            <tr key={ret.id} className="hover:bg-neutral-50/20 transition">
              <td className="py-4 px-5">
                <span className="font-semibold text-neutral-900 block">
                  {ret.orders?.order_number}
                </span>
                <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                  Tgl Ajuan: {new Date(ret.created_at).toLocaleDateString()}
                </span>
              </td>
              <td className="py-4 px-4">
                <p>{ret.profiles?.name}</p>
                <p className="text-[10px] text-neutral-400 font-normal">{ret.profiles?.email}</p>
              </td>
              <td className="py-4 px-4 text-neutral-600 truncate max-w-[200px]">
                <span className="font-bold text-neutral-800">
                  {ret.reason === 'wrong_item'
                    ? 'Salah Produk'
                    : ret.reason === 'damaged_item'
                      ? 'Barang Rusak'
                      : ret.reason === 'missing_item'
                        ? 'Barang Kurang'
                        : ret.reason === 'not_as_described'
                          ? 'Tidak Sesuai Deskripsi'
                          : ret.reason === 'size_issue'
                            ? 'Salah Ukuran'
                            : 'Lainnya'}
                </span>
                {ret.customer_notes && (
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {ret.customer_notes}
                  </p>
                )}
              </td>
              <td className="py-4 px-4 text-center">
                <p className="font-bold">
                  Rp {(ret.refund_amount || ret.orders?.total_amount || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] text-neutral-500 font-normal">
                  {ret.refund_bank_name} - {ret.refund_account_number}
                </p>
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 ${
                    ret.status === 'completed'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : ret.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : ret.status === 'approved'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {ret.status === 'pending'
                    ? 'Menunggu'
                    : ret.status === 'approved'
                      ? 'Disetujui'
                      : ret.status === 'rejected'
                        ? 'Ditolak'
                        : 'Selesai'}
                </span>
              </td>
              <td className="py-4 px-5 text-right">
                <Button
                  onClick={() => onOpenReturnModal(ret)}
                  variant="outline"
                  className="text-xs uppercase py-2 px-3 border-neutral-200"
                >
                  Periksa Retur
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
