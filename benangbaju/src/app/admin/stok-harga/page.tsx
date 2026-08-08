'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  useAdminVariants,
  useAdminUpdateVariant,
  useAdminBatchUpdateVariants,
} from '@/app/admin/hooks/useAdmin'
import type { AdminVariantListItem, UpdateVariantInput } from '@/modules/products/types'
import {
  Button,
  AdminPageHeader,
  DataTable,
  Pagination,
  AdminSearchInput,
  SmartLink as Link,
  HandDrawnIcon,
} from '@/shared/components'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import type { Column } from '@/shared/components/DataTable'

export default function AdminVariantStockPricePage(): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'>('newest')
  const [page, setPage] = useState(1)
  const limit = 20

  // Draft edits map: variantId -> { price, compare_price, stock, is_active }
  const [drafts, setDrafts] = useState<Record<string, { price: number; compare_price: number | null; stock: number; is_active: boolean }>>({})

  const { data: dataRes, isLoading, isError, refetch } = useAdminVariants({
    page,
    limit,
    search,
    stockFilter,
    statusFilter,
    sortBy,
  })

  const updateSingleMutation = useAdminUpdateVariant()
  const batchUpdateMutation = useAdminBatchUpdateVariants()

  const variants = dataRes?.data || []
  const totalCount = dataRes?.pagination?.total_count || 0
  const totalPages = Math.ceil(totalCount / limit)

  // Get current working values for a variant (draft or original)
  const getVariantValue = useCallback(
    (v: AdminVariantListItem) => {
      if (drafts[v.id]) {
        return drafts[v.id]
      }
      return {
        price: v.price,
        compare_price: v.compare_price,
        stock: v.stock,
        is_active: v.is_active,
      }
    },
    [drafts]
  )

  // Check if a row has uncommitted changes
  const isRowDirty = useCallback(
    (v: AdminVariantListItem) => {
      const draft = drafts[v.id]
      if (!draft) return false
      return (
        draft.price !== v.price ||
        draft.compare_price !== v.compare_price ||
        draft.stock !== v.stock ||
        draft.is_active !== v.is_active
      )
    },
    [drafts]
  )

  // Calculate dirty rows count
  const dirtyVariantIds = useMemo(() => {
    return variants.filter((v) => isRowDirty(v)).map((v) => v.id)
  }, [variants, isRowDirty])

  // Update a single field in draft
  const handleDraftChange = useCallback(
    (variantId: string, field: 'price' | 'compare_price' | 'stock' | 'is_active', value: number | boolean | null) => {
      setDrafts((prev) => {
        const original = variants.find((item) => item.id === variantId)
        if (!original) return prev

        const currentDraft = prev[variantId] || {
          price: original.price,
          compare_price: original.compare_price,
          stock: original.stock,
          is_active: original.is_active,
        }

        const updated = {
          ...currentDraft,
          [field]: value,
        }

        // Clean draft if restored to original
        if (
          updated.price === original.price &&
          updated.compare_price === original.compare_price &&
          updated.stock === original.stock &&
          updated.is_active === original.is_active
        ) {
          const newDrafts = { ...prev }
          delete newDrafts[variantId]
          return newDrafts
        }

        return {
          ...prev,
          [variantId]: updated,
        }
      })
    },
    [variants]
  )

  // Save single variant
  const handleSaveSingle = useCallback(
    async (variant: AdminVariantListItem) => {
      const draft = drafts[variant.id]
      if (!draft) return

      try {
        const payload: UpdateVariantInput = {
          variantId: variant.id,
          price: Number(draft.price) || 0,
          compare_price: draft.compare_price ? Number(draft.compare_price) : null,
          stock: Math.max(0, Number(draft.stock) || 0),
          is_active: draft.is_active,
        }

        await updateSingleMutation.mutateAsync({ variantId: variant.id, data: payload })
        toast.success(`Varian ${variant.name} (${variant.sku}) berhasil disimpan`)

        // Clear local draft for this row
        setDrafts((prev) => {
          const next = { ...prev }
          delete next[variant.id]
          return next
        })
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menyimpan varian'
        toast.error(msg)
      }
    },
    [drafts, updateSingleMutation, refetch]
  )

  // Reset single row draft
  const handleResetSingle = useCallback((variantId: string) => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[variantId]
      return next
    })
  }, [])

  // Save all modified rows on current page
  const handleSaveAll = useCallback(async () => {
    if (dirtyVariantIds.length === 0) return

    const updates: UpdateVariantInput[] = dirtyVariantIds.map((id) => {
      const draft = drafts[id]
      return {
        variantId: id,
        price: Number(draft.price) || 0,
        compare_price: draft.compare_price ? Number(draft.compare_price) : null,
        stock: Math.max(0, Number(draft.stock) || 0),
        is_active: draft.is_active,
      }
    })

    try {
      await batchUpdateMutation.mutateAsync(updates)
      toast.success(`${updates.length} varian berhasil diperbarui`)
      setDrafts({})
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui daftar varian'
      toast.error(msg)
    }
  }, [dirtyVariantIds, drafts, batchUpdateMutation, refetch])

  // Reset all drafts
  const handleResetAll = useCallback(() => {
    setDrafts({})
  }, [])

  // Quick stats summary
  const stats = useMemo(() => {
    const totalItems = totalCount
    const outOfStockCount = variants.filter((v) => (drafts[v.id]?.stock ?? v.stock) <= 0).length
    const lowStockCount = variants.filter((v) => {
      const st = drafts[v.id]?.stock ?? v.stock
      return st > 0 && st <= 5
    }).length
    return { totalItems, outOfStockCount, lowStockCount }
  }, [totalCount, variants, drafts])

  const columns: Column<AdminVariantListItem>[] = useMemo(
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
        header: 'Harga (Rp) & Harga Coret',
        render: (v) => {
          const val = getVariantValue(v)
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
                    handleDraftChange(v.id, 'compare_price', raw === '' ? null : Math.max(0, parseInt(raw) || 0))
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
        header: 'Stok',
        className: 'text-center',
        render: (v) => {
          const val = getVariantValue(v)
          const stockNum = Number(val.stock) || 0
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
                value={val.stock}
                onChange={(e) =>
                  handleDraftChange(v.id, 'stock', Math.max(0, parseInt(e.target.value) || 0))
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
                    isLoading={updateSingleMutation.isPending}
                    className="bg-brand-gold hover:bg-brand-gold/90 text-brand-plum font-bold text-[10px] uppercase px-2.5 py-1"
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
    [getVariantValue, handleDraftChange, isRowDirty, handleSaveSingle, handleResetSingle, updateSingleMutation.isPending]
  )

  return (
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        title="Stok & Harga Varian"
        subtitle="Kelola harga jual, harga coret, dan stok semua varian produk secara efisien dari satu halaman."
      >
        <div className="flex items-center space-x-3">
          {dirtyVariantIds.length > 0 && (
            <Button
              onClick={handleSaveAll}
              isLoading={batchUpdateMutation.isPending}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-plum text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5 shadow-sm"
            >
              <HandDrawnIcon name="check" className="h-3.5 w-3.5 mr-1.5" /> Simpan Semua ({dirtyVariantIds.length})
            </Button>
          )}
          <Link href="/admin/produk">
            <Button variant="outline" className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-4 border-neutral-300">
              <HandDrawnIcon name="kancing" className="h-3.5 w-3.5 mr-1.5" /> Daftar Produk
            </Button>
          </Link>
        </div>
      </AdminPageHeader>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[11px] font-heading uppercase tracking-wider text-neutral-500 font-semibold">
            Total Varian
          </p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.totalItems}</p>
        </div>
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[11px] font-heading uppercase tracking-wider text-amber-700 font-semibold">
            Stok Menipis (1-5)
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStockCount}</p>
        </div>
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[11px] font-heading uppercase tracking-wider text-red-700 font-semibold">
            Stok Habis (0)
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockCount}</p>
        </div>
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[11px] font-heading uppercase tracking-wider text-emerald-700 font-semibold">
            Perubahan Belum Disimpan
          </p>
          <p className="text-2xl font-bold text-brand-plum mt-1">{dirtyVariantIds.length}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:space-x-4">
        <div className="flex-1 max-w-md">
          <AdminSearchInput
            placeholder="Cari nama produk, nama varian, atau SKU..."
            value={search}
            onChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setStockFilter(e.target.value as any)
              setPage(1)
            }}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value="all">Semua Stok</option>
            <option value="in_stock">Stok Tersedia (&gt;0)</option>
            <option value="low_stock">Stok Menipis (1-5)</option>
            <option value="out_of_stock">Stok Habis (0)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setStatusFilter(e.target.value as any)
              setPage(1)
            }}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value="all">Semua Status</option>
            <option value="active">Status: Aktif</option>
            <option value="inactive">Status: Nonaktif</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setSortBy(e.target.value as any)
              setPage(1)
            }}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value="newest">Urutan: Terbaru</option>
            <option value="name_asc">Nama (A - Z)</option>
            <option value="price_asc">Harga (Rendah - Tinggi)</option>
            <option value="price_desc">Harga (Tinggi - Rendah)</option>
            <option value="stock_asc">Stok (Sedikit - Banyak)</option>
            <option value="stock_desc">Stok (Banyak - Sedikit)</option>
          </select>
        </div>
      </div>

      {/* Dirty Draft Bar Warning */}
      {dirtyVariantIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-slide-up">
          <div className="flex items-center space-x-2 text-amber-900">
            <HandDrawnIcon name="edit" className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold">
              Terdapat <strong>{dirtyVariantIds.length}</strong> varian yang belum disimpan di halaman ini.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-amber-100/60 transition"
            >
              Batalkan Semua
            </button>
            <Button
              size="sm"
              onClick={handleSaveAll}
              isLoading={batchUpdateMutation.isPending}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-plum font-bold uppercase text-[11px] px-4 py-2"
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="border border-neutral-200 bg-brand-cream rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        {isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">
              Gagal memuat varian dari server
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block"
            >
              Coba Lagi
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={variants}
            isLoading={isLoading}
            emptyTitle="Tidak ada varian ditemukan"
            emptyDescription={
              search
                ? 'Coba gunakan kata kunci pencarian atau filter yang berbeda.'
                : 'Belum ada varian produk tersimpan.'
            }
            className="border-0"
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-neutral-150 px-5 py-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              showInfo
              totalItems={totalCount}
            />
          </div>
        )}
      </div>
    </div>
  )
}
