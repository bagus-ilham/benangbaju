'use client'

import React, { useMemo } from 'react'
import type { AdminVariantListItem } from '@/modules/products/types'
import { Button, SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import type { Column } from '@/shared/components/DataTable'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/utils/format'

export interface VariantDraft {
  price: number
  compare_price: number | null
  price_myr: number | null
  compare_price_myr: number | null
  stock: number
  stock_my: number
  is_active: boolean
}

export type VariantDraftField = keyof VariantDraft

interface UseStockPriceColumnsParams {
  marketMode: 'ID' | 'MY'
  getVariantValue: (v: AdminVariantListItem) => VariantDraft
  handleDraftChange: (
    variantId: string,
    field: VariantDraftField,
    value: number | boolean | null
  ) => void
  isRowDirty: (v: AdminVariantListItem) => boolean
  handleSaveSingle: (v: AdminVariantListItem) => void
  handleResetSingle: (variantId: string) => void
  isSingleSaving: boolean
}

export function useStockPriceColumns({
  marketMode,
  getVariantValue,
  handleDraftChange,
  isRowDirty,
  handleSaveSingle,
  handleResetSingle,
  isSingleSaving,
}: UseStockPriceColumnsParams): Column<AdminVariantListItem>[] {
  return useMemo(
    () => [
      {
        key: 'product_name',
        header: 'Produk',
        render: (v) => (
          <div className="space-y-1">
            <Link
              href={`/admin/produk/${v.product_id}`}
              className="font-semibold text-neutral-900 text-xs hover:text-brand-plum transition block line-clamp-1"
              title="Edit Produk"
            >
              {v.product_name}
            </Link>
            {v.category_name && (
              <span className="inline-block text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium">
                {v.category_name}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'variant_name',
        header: 'Varian & SKU',
        render: (v) => (
          <div>
            <span className="font-medium text-neutral-800 text-xs block">{v.name || 'Default'}</span>
            <span className="text-[10px] font-mono text-neutral-400 block tracking-wider uppercase mt-0.5">
              {v.sku || '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'price',
        header: marketMode === 'MY' ? 'Harga Malaysia (RM) & Coret' : 'Harga Indonesia (Rp) & Coret',
        render: (v) => {
          const val = getVariantValue(v)
          if (marketMode === 'MY') {
            return (
              <div className="space-y-1.5 min-w-[150px]">
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-[10px] text-emerald-700 font-bold select-none">
                    RM
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.10"
                    value={val.price_myr ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      handleDraftChange(
                        v.id,
                        'price_myr',
                        raw === '' ? null : Math.max(0, parseFloat(raw) || 0)
                      )
                    }}
                    className="w-full pl-9 pr-2 py-1 text-xs font-medium border border-emerald-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white transition"
                    placeholder="Kosong = Sembunyi"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1 text-[9px] text-neutral-400 select-none">
                    Coret
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.10"
                    value={val.compare_price_myr ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      handleDraftChange(
                        v.id,
                        'compare_price_myr',
                        raw === '' ? null : Math.max(0, parseFloat(raw) || 0)
                      )
                    }}
                    className="w-full pl-10 pr-2 py-0.5 text-[11px] text-neutral-500 border border-neutral-200 rounded-md focus:border-emerald-600 outline-none bg-white/80"
                    placeholder="Opsional (RM)"
                  />
                </div>
                <div className="text-[9px] text-neutral-400">ID: {formatIDR(val.price)}</div>
              </div>
            )
          }

          return (
            <div className="space-y-1.5 min-w-[140px]">
              <div className="relative">
                <span className="absolute left-2.5 top-1.2 text-[10px] text-neutral-400 font-semibold select-none">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={val.price}
                  onChange={(e) =>
                    handleDraftChange(v.id, 'price', Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full pl-8 pr-2 py-1 text-xs font-medium border border-neutral-200 rounded-lg focus:border-brand-plum focus:ring-1 focus:ring-brand-plum outline-none bg-white transition"
                  placeholder="Harga jual"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1 text-[9px] text-neutral-400 select-none">
                  Coret
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={val.compare_price ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    handleDraftChange(
                      v.id,
                      'compare_price',
                      raw === '' ? null : Math.max(0, parseInt(raw) || 0)
                    )
                  }}
                  className="w-full pl-10 pr-2 py-0.5 text-[11px] text-neutral-500 border border-neutral-200 rounded-md focus:border-brand-plum outline-none bg-white/80"
                  placeholder="Opsional"
                />
              </div>
            </div>
          )
        },
      },
      {
        key: 'stock',
        header: marketMode === 'MY' ? 'Stok Malaysia' : 'Stok Indonesia',
        className: 'text-center',
        render: (v) => {
          const val = getVariantValue(v)
          const stockNum = marketMode === 'MY' ? Number(val.stock_my) || 0 : Number(val.stock) || 0
          const badgeColor =
            stockNum <= 0
              ? 'bg-red-100 text-red-700 border-red-200'
              : stockNum <= 5
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'

          return (
            <div className="flex flex-col items-center space-y-1.5 min-w-[90px]">
              <input
                type="number"
                min={0}
                value={stockNum}
                onChange={(e) =>
                  handleDraftChange(
                    v.id,
                    marketMode === 'MY' ? 'stock_my' : 'stock',
                    Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                className="w-20 text-center py-1 text-xs font-bold border border-neutral-200 rounded-lg focus:border-brand-plum outline-none bg-white transition"
              />
              <span
                className={cn(
                  'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  badgeColor
                )}
              >
                {stockNum <= 0 ? 'Habis' : stockNum <= 5 ? 'Menipis' : 'Tersedia'}
              </span>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        className: 'text-center',
        render: (v) => {
          const val = getVariantValue(v)
          return (
            <button
              type="button"
              onClick={() => handleDraftChange(v.id, 'is_active', !val.is_active)}
              className={cn(
                'inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md transition border',
                val.is_active
                  ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200'
              )}
            >
              {val.is_active ? 'Aktif' : 'Nonaktif'}
            </button>
          )
        },
      },
      {
        key: 'actions',
        header: <div className="text-right w-full">Aksi</div>,
        className: 'text-right',
        render: (v) => {
          const dirty = isRowDirty(v)
          return (
            <div className="flex items-center justify-end space-x-1.5 min-w-[100px]">
              {dirty ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleSaveSingle(v)}
                    isLoading={isSingleSaving}
                    className="bg-brand-gold hover:bg-brand-gold-hover text-brand-plum font-bold text-[10px] uppercase px-2.5 py-1"
                    title="Simpan perubahan baris ini"
                  >
                    Simpan
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleResetSingle(v.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 transition"
                    title="Batal perubahan"
                  >
                    <HandDrawnIcon name="close" className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <span className="text-[10px] text-neutral-300 italic font-mono">Tersimpan</span>
              )}
            </div>
          )
        },
      },
    ],
    [
      marketMode,
      getVariantValue,
      handleDraftChange,
      isRowDirty,
      handleSaveSingle,
      handleResetSingle,
      isSingleSaving,
    ]
  )
}
