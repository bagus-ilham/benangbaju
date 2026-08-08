'use client'

import React, { useMemo } from 'react'
import { Button, HandDrawnIcon, DataTable } from '@/shared/components'
import type { Column } from '@/shared/components/DataTable'
import type { AdminCollectionItem } from '@/modules/collections/types'
import { formatDate } from '@/lib/utils'

interface CollectionListTableProps {
  collections: AdminCollectionItem[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onToggleActive: (col: AdminCollectionItem) => void
  onEdit: (col: AdminCollectionItem) => void
  onDuplicate: (col: AdminCollectionItem) => void
  onDelete: (id: string) => void
  onUpdateSortOrder?: (col: AdminCollectionItem, newOrder: number) => void
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
  onUpdateSortOrder,
}: CollectionListTableProps) {
  const columns: Column<AdminCollectionItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nama Koleksi',
        render: (col) => (
          <div>
            <span className="font-semibold text-neutral-900 text-sm block">{col.name}</span>
            {col.starts_at && (
              <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                Periode: {formatDate(col.starts_at)} -{' '}
                {col.ends_at ? formatDate(col.ends_at) : 'Selamanya'}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'slug',
        header: 'Slug',
        render: (col) => <span className="font-mono text-neutral-500">{col.slug}</span>,
      },
      {
        key: 'product_count',
        header: <div className="text-center w-full">Produk Terkait</div>,
        className: 'text-center font-bold',
        render: (col) => `${col.product_ids?.length || 0} Produk`,
      },
      {
        key: 'sort_order',
        header: <div className="text-center w-full">No. Urut</div>,
        className: 'text-center',
        render: (col) => (
          <input
            type="number"
            defaultValue={col.sort_order ?? 0}
            key={`${col.id}-${col.sort_order}`}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val !== col.sort_order) {
                onUpdateSortOrder?.(col, val)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className="w-16 text-center font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-plum/40 focus:border-brand-plum transition shadow-sm"
            title="Ubah no. urut (Tekan Enter atau klik di luar untuk menyimpan)"
          />
        ),
      },
      {
        key: 'is_active',
        header: <div className="text-center w-full">Status</div>,
        className: 'text-center',
        render: (col) => (
          <button
            onClick={() => onToggleActive(col)}
            className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition rounded-full ${
              col.is_active
                ? 'bg-neutral-900 text-white border border-neutral-900'
                : 'bg-brand-cream text-neutral-400 border border-neutral-200'
            }`}
          >
            {col.is_active ? 'Aktif' : 'Nonaktif'}
          </button>
        ),
      },
      {
        key: 'actions',
        header: <div className="text-right w-full">Aksi</div>,
        className: 'text-right',
        render: (col) => (
          <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap">
            <Button
              onClick={() => onDuplicate(col)}
              variant="outline"
              className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
              title="Duplikat Koleksi"
            >
              <HandDrawnIcon name="copy" className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onEdit(col)}
              variant="outline"
              className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
              title="Edit Koleksi"
            >
              <HandDrawnIcon name="edit" className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(col.id)}
              variant="outline"
              className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <HandDrawnIcon name="trash" className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onToggleActive, onEdit, onDuplicate, onDelete, onUpdateSortOrder]
  )

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

  return (
    <DataTable
      columns={columns}
      data={collections}
      isLoading={isLoading}
      emptyTitle="Belum ada koleksi kurasi ditambahkan"
      emptyDescription="Tambahkan koleksi editorial atau promosi musiman baru."
      className="border-0"
    />
  )
}
