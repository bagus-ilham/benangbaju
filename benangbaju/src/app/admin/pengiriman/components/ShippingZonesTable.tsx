'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components'
import type { ShippingZone } from '@/modules/shipping/types'

interface ShippingZonesTableProps {
  zones: ShippingZone[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onEdit: (zone: ShippingZone) => void
  onDelete: (id: string, name: string) => void
}

export function ShippingZonesTable({
  zones,
  isLoading,
  isError,
  onRefetch,
  onEdit,
  onDelete,
}: ShippingZonesTableProps) {
  if (isLoading) return <div className="h-40 bg-white border border-neutral-200 animate-pulse" />

  if (isError) {
    return (
      <div className="text-center py-12 border border-neutral-200 bg-white">
        <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat zona pengiriman</p>
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

  if (zones.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
        Belum ada zona pengiriman custom yang terdaftar.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {zones.map((zone) => (
        <motion.div
          key={zone.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-neutral-200 bg-white p-5 space-y-4 flex flex-col justify-between hover:shadow-xs transition duration-150"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-serif font-bold text-neutral-900 text-base">{zone.name}</h3>
              <span
                className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                  zone.is_active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {zone.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            {zone.description && <p className="text-xs text-neutral-500">{zone.description}</p>}

            <div className="pt-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                Cakupan Provinsi:
              </p>
              {zone.shipping_zone_coverage && zone.shipping_zone_coverage.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    zone.shipping_zone_coverage.map((c: any) => (
                      <span
                        key={c.province_name}
                        className="bg-neutral-100 text-neutral-700 text-[10px] px-2 py-0.5 font-medium border border-neutral-200"
                      >
                        {c.province_name}
                      </span>
                    ))
                  }
                </div>
              ) : (
                <p className="text-xs text-red-500 italic font-medium">
                  Belum ada provinsi yang dicakup zona ini.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
            <Button
              onClick={() => onEdit(zone)}
              variant="outline"
              className="text-[10px] py-1.5 px-3 font-bold uppercase border-neutral-200"
            >
              <Edit size={11} className="mr-1" /> Edit
            </Button>
            <Button
              onClick={() => onDelete(zone.id, zone.name)}
              variant="outline"
              className="text-[10px] py-1.5 px-3 font-bold uppercase border-red-200 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={11} className="mr-1" /> Hapus
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
