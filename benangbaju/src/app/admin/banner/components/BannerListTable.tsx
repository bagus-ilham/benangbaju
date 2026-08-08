'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { Button, HandDrawnIcon, DataTable } from '@/shared/components'
import type { Column } from '@/shared/components/DataTable'
import type { Database } from '@/shared/types/database'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { formatDate } from '@/lib/utils'

type BannerRow = Database['public']['Tables']['banners']['Row']

interface BannerListTableProps {
  banners: BannerRow[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onToggleActive: (b: BannerRow) => void
  onEdit: (b: BannerRow) => void
  onDuplicate: (b: BannerRow) => void
  onDelete: (id: string) => void
  onUpdateSortOrder?: (b: BannerRow, newOrder: number) => void
}

export function BannerListTable({
  banners,
  isLoading,
  isError,
  onRefetch,
  onToggleActive,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateSortOrder,
}: BannerListTableProps) {
  const columns: Column<BannerRow>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Banner Preview',
        render: (b) => (
          <div className="flex items-center space-x-3.5">
            <div className="w-24 h-12 bg-neutral-100 border border-neutral-200 flex-shrink-0 relative overflow-hidden select-none rounded-md">
              <Image
                src={getProxiedImageUrl(b.image_url || '')}
                alt={b.title || ''}
                fill
                sizes="96px"
                unoptimized
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x300?text=No+Image'
                }}
              />
            </div>
            <div>
              <span className="font-semibold text-neutral-900 text-sm block">
                {b.title || 'Untitled Banner'}
              </span>
              {b.subtitle && (
                <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                  {b.subtitle}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'position',
        header: 'Posisi',
        render: (b) => (
          <span className="font-mono text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">
            {b.position === 'homepage_hero' ? 'Hero Slider' : 'Mid Banner'}
          </span>
        ),
      },
      {
        key: 'sort_order',
        header: <div className="text-center w-full">No. Urut</div>,
        className: 'text-center',
        render: (b) => (
          <input
            type="number"
            defaultValue={b.sort_order ?? 0}
            key={`${b.id}-${b.sort_order}`}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val !== b.sort_order) {
                onUpdateSortOrder?.(b, val)
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
        key: 'starts_at',
        header: <div className="text-center w-full">Periode Aktif</div>,
        className: 'text-center text-neutral-500',
        render: (b) =>
          b.starts_at ? (
            <>
              <p>{formatDate(b.starts_at)}</p>
              <p className="text-[10px] text-neutral-400">
                s.d {b.ends_at ? formatDate(b.ends_at) : 'Selamanya'}
              </p>
            </>
          ) : (
            'Selamanya'
          ),
      },
      {
        key: 'is_active',
        header: <div className="text-center w-full">Status</div>,
        className: 'text-center',
        render: (b) => (
          <button
            onClick={() => onToggleActive(b)}
            className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition rounded-full ${
              b.is_active
                ? 'bg-neutral-900 text-white border border-neutral-900'
                : 'bg-brand-cream text-neutral-400 border border-neutral-200'
            }`}
          >
            {b.is_active ? 'Aktif' : 'Nonaktif'}
          </button>
        ),
      },
      {
        key: 'actions',
        header: <div className="text-right w-full">Aksi</div>,
        className: 'text-right',
        render: (b) => (
          <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap">
            <Button
              onClick={() => onDuplicate(b)}
              variant="outline"
              className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
              title="Duplikat Banner"
            >
              <HandDrawnIcon name="copy" className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onEdit(b)}
              variant="outline"
              className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
              title="Edit Banner"
            >
              <HandDrawnIcon name="edit" className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(b.id)}
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
          Gagal memuat banner dari server
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
      data={banners}
      isLoading={isLoading}
      emptyTitle="Belum ada banner promosi ditambahkan"
      emptyDescription="Tambahkan banner promosi baru untuk halaman depan toko."
      className="border-0"
    />
  )
}
