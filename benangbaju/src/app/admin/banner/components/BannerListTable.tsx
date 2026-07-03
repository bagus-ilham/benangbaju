'use client'

import React from 'react'
import Image from 'next/image'
import { Edit2, Trash2, Copy } from 'lucide-react'
import { Button } from '@/shared/components'
import type { Database } from '@/shared/types/database'

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
}: BannerListTableProps) {
  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat banner...
        </p>
      </div>
    )
  }

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

  if (banners.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-400 italic text-xs">
        Belum ada banner promosi ditambahkan.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
            <th className="py-3 px-5">Banner Preview</th>
            <th className="py-3 px-4">Posisi</th>
            <th className="py-3 px-4 text-center">No. Urut</th>
            <th className="py-3 px-4 text-center">Periode Aktif</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
          {banners.map((b: BannerRow) => (
            <tr key={b.id} className="hover:bg-neutral-50/20 transition duration-150">
              <td className="py-4 px-5 flex items-center space-x-3.5">
                <div className="w-24 h-12 bg-neutral-100 border border-neutral-200 flex-shrink-0 relative overflow-hidden select-none">
                  <Image
                    src={b.image_url || ''}
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
              </td>
              <td className="py-4 px-4 font-mono text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">
                {b.position === 'homepage_hero' ? 'Hero Slider' : 'Mid Banner'}
              </td>
              <td className="py-4 px-4 text-center font-semibold text-neutral-900">
                {b.sort_order}
              </td>
              <td className="py-4 px-4 text-center text-neutral-500">
                {b.starts_at ? (
                  <>
                    <p>{new Date(b.starts_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-neutral-400">
                      s.d {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : 'Selamanya'}
                    </p>
                  </>
                ) : (
                  'Selamanya'
                )}
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onToggleActive(b)}
                  className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                    b.is_active
                      ? 'bg-neutral-900 text-white border border-neutral-900'
                      : 'bg-white text-neutral-400 border border-neutral-200'
                  }`}
                >
                  {b.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
              </td>
              <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                <Button
                  onClick={() => onDuplicate(b)}
                  variant="outline"
                  className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                  title="Duplikat Banner"
                >
                  <Copy size={13} />
                </Button>
                <Button
                  onClick={() => onEdit(b)}
                  variant="outline"
                  className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                  title="Edit Banner"
                >
                  <Edit2 size={13} />
                </Button>
                <Button
                  onClick={() => onDelete(b.id)}
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
