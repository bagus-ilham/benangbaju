'use client'

import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components'
import { formatIDR } from '@/lib/utils/format'
import type { ShippingRate } from '@/modules/shipping/types'

interface ShippingRatesTableProps {
  rates: ShippingRate[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onEdit: (rate: ShippingRate) => void
  onDelete: (id: string, name: string) => void
}

export function ShippingRatesTable({
  rates,
  isLoading,
  isError,
  onRefetch,
  onEdit,
  onDelete,
}: ShippingRatesTableProps) {
  if (isLoading) return <div className="h-40 bg-white border border-neutral-200 animate-pulse" />

  if (isError) {
    return (
      <div className="text-center py-12 border border-neutral-200 bg-white">
        <p className="text-red-500 text-xs font-semibold uppercase">
          Gagal memuat tarif pengiriman
        </p>
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

  if (rates.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
        Belum ada tarif pengiriman kurir yang terdaftar.
      </div>
    )
  }

  return (
    <div className="border border-neutral-200 bg-white rounded-none overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-400 uppercase tracking-wider font-semibold">
            <th className="py-4 px-6">Nama Kurir</th>
            <th className="py-4 px-6">Zona</th>
            <th className="py-4 px-6 text-right">Biaya Awal</th>
            <th className="py-4 px-6 text-right">Tarif / Kg</th>
            <th className="py-4 px-6 text-center">Estimasi Tiba</th>
            <th className="py-4 px-6 text-center">Status</th>
            <th className="py-4 px-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
          {rates.map((rate) => (
            <tr key={rate.id} className="hover:bg-neutral-50/30">
              <td className="py-4 px-6 font-bold text-neutral-900 uppercase">
                {rate.courier_name}
              </td>
              <td className="py-4 px-6">{rate.shipping_zones?.name || 'Zona Tidak Diketahui'}</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-800">
                {formatIDR(rate.base_price)}
              </td>
              <td className="py-4 px-6 text-right text-neutral-600">
                {formatIDR(rate.price_per_kg)}
              </td>
              <td className="py-4 px-6 text-center">
                {rate.etd_days_min} - {rate.etd_days_max} Hari
              </td>
              <td className="py-4 px-6 text-center">
                <span
                  className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                    rate.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {rate.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="py-4 px-6 text-right space-x-1.5">
                <button
                  onClick={() => onEdit(rate)}
                  className="text-neutral-500 hover:text-neutral-800 p-1.5 inline-block border border-neutral-200"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => onDelete(rate.id, rate.courier_name)}
                  className="text-red-500 hover:text-red-700 p-1.5 inline-block border border-red-100 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
