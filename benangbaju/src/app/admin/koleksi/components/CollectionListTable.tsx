'use client'

import React from 'react'
import { Edit2, Trash2, Copy } from 'lucide-react'
import { Button } from '@/shared/components'
import type { AdminCollectionItem } from '@/modules/collections/types'

interface CollectionListTableProps {
  collections: AdminCollectionItem[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onToggleActive: (col: AdminCollectionItem) => void
  onEdit: (col: AdminCollectionItem) => void
  onDuplicate: (col: AdminCollectionItem) => void
  onDelete: (id: string) => void
}

export function CollectionListTable({
  collections,
  isLoading,
  isError,
  onRefetch,
  onToggleActive,
  onEdit,
  onDuplicate,
  onDelete,
}: CollectionListTableProps) {
  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat koleksi...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-500 text-xs font-semibold uppercase">
          Gagal memuat koleksi dari server
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

  if (collections.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-400 italic text-xs">
        Belum ada koleksi kurasi ditambahkan.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
            <th className="py-3 px-5">Nama Koleksi</th>
            <th className="py-3 px-4">Slug</th>
            <th className="py-3 px-4 text-center">Produk Terkait</th>
            <th className="py-3 px-4 text-center">No. Urut</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
          {collections.map((col: AdminCollectionItem) => (
            <tr key={col.id} className="hover:bg-neutral-50/20 transition duration-150">
              <td className="py-4 px-5">
                <span className="font-semibold text-neutral-900 text-sm block">{col.name}</span>
                {col.starts_at && (
                  <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                    Periode: {new Date(col.starts_at).toLocaleDateString()} -{' '}
                    {col.ends_at ? new Date(col.ends_at).toLocaleDateString() : 'Selamanya'}
                  </span>
                )}
              </td>
              <td className="py-4 px-4 font-mono text-neutral-500">{col.slug}</td>
              <td className="py-4 px-4 text-center font-bold">
                {col.product_ids?.length || 0} Produk
              </td>
              <td className="py-4 px-4 text-center font-semibold text-neutral-900">
                {col.sort_order}
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onToggleActive(col)}
                  className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                    col.is_active
                      ? 'bg-neutral-900 text-white border border-neutral-900'
                      : 'bg-white text-neutral-400 border border-neutral-200'
                  }`}
                >
                  {col.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
              </td>
              <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                <Button
                  onClick={() => onDuplicate(col)}
                  variant="outline"
                  className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                  title="Duplikat Koleksi"
                >
                  <Copy size={13} />
                </Button>
                <Button
                  onClick={() => onEdit(col)}
                  variant="outline"
                  className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                  title="Edit Koleksi"
                >
                  <Edit2 size={13} />
                </Button>
                <Button
                  onClick={() => onDelete(col.id)}
                  variant="outline"
                  className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
