'use client'

import React from 'react'
import { Copy, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components'
import type { AdminFlashSaleListItem } from '@/modules/flash-sales/types'

interface FlashSaleListTableProps {
  campaigns: AdminFlashSaleListItem[]
  isLoading: boolean
  onToggleActive: (camp: AdminFlashSaleListItem) => void
  onDuplicate: (camp: AdminFlashSaleListItem) => void
  onEdit: (camp: AdminFlashSaleListItem) => void
  onDelete: (id: string) => void
}

export function FlashSaleListTable({
  campaigns,
  isLoading,
  onToggleActive,
  onDuplicate,
  onEdit,
  onDelete,
}: FlashSaleListTableProps) {
  return (
    <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
      {isLoading ? (
        <div className="py-24 text-center">
          <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
            Memuat flash sale...
          </p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-24 text-center text-neutral-400 italic text-xs">
          Belum ada promo flash sale ditambahkan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                <th className="py-3 px-5">Nama Kampanye</th>
                <th className="py-3 px-4">Slot Jadwal</th>
                <th className="py-3 px-4 text-center">Item Promo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
              {campaigns.map((camp) => {
                const now = new Date()
                const start = new Date(camp.starts_at)
                const end = new Date(camp.ends_at)
                const isRunning = camp.is_active && start <= now && end >= now

                return (
                  <tr key={camp.id} className="hover:bg-neutral-50/20 transition duration-150">
                    <td className="py-4 px-5">
                      <span className="font-semibold text-neutral-900 text-sm block">
                        {camp.name}
                      </span>
                      {isRunning && (
                        <span className="inline-block mt-1 text-[8px] bg-red-600 text-white font-bold tracking-wider uppercase px-2 py-0.5 rounded-none">
                          Sedang Berjalan (LIVE)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-neutral-600 font-medium leading-relaxed">
                      <p>Mulai: {new Date(camp.starts_at).toLocaleString()}</p>
                      <p className="text-[10px] text-neutral-400">
                        Selesai: {new Date(camp.ends_at).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center font-bold">
                      {camp.flash_sale_items?.length || 0} Produk Varian
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onToggleActive(camp)}
                        className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                          camp.is_active
                            ? 'bg-neutral-900 text-white border border-neutral-900'
                            : 'bg-white text-neutral-400 border border-neutral-200'
                        }`}
                      >
                        {camp.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        onClick={() => onDuplicate(camp)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        title="Duplikat Flash Sale"
                      >
                        <Copy size={13} />
                      </Button>
                      <Button
                        onClick={() => onEdit(camp)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        title="Edit Flash Sale"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        onClick={() => onDelete(camp.id)}
                        variant="outline"
                        className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
