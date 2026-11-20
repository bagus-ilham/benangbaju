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
  SmartLink as Link,
  HandDrawnIcon,
} from '@/shared/components'
import toast from 'react-hot-toast'
import {
  StockPriceToolbar,
  type StockFilterType,
  type StatusFilterType,
  type SortByType,
} from './components/StockPriceToolbar'
import {
  useStockPriceColumns,
  type VariantDraft,
  type VariantDraftField,
} from './components/useStockPriceColumns'

function buildVariantUpdatePayload(variantId: string, draft: VariantDraft): UpdateVariantInput {
  return {
    variantId,
    price: Number(draft.price) || 0,
    compare_price: draft.compare_price ? Number(draft.compare_price) : null,
    price_myr: draft.price_myr != null && Number(draft.price_myr) > 0 ? Number(draft.price_myr) : null,
    compare_price_myr:
      draft.compare_price_myr != null && Number(draft.compare_price_myr) > 0
        ? Number(draft.compare_price_myr)
        : null,
    stock: Math.max(0, Number(draft.stock) || 0),
    stock_my: Math.max(0, Number(draft.stock_my) || 0),
    is_active: draft.is_active,
  }
}

export default function AdminVariantStockPricePage(): React.JSX.Element {
  const [marketMode, setMarketMode] = useState<'ID' | 'MY'>('ID')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')
  const [sortBy, setSortBy] = useState<SortByType>('newest')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({})

  const { data: dataRes, isLoading, isError, refetch } = useAdminVariants({
    page,
    limit,
    search,
    stockFilter,
    statusFilter,
    sortBy,
    market: marketMode,
  })

  const updateSingleMutation = useAdminUpdateVariant()
  const batchUpdateMutation = useAdminBatchUpdateVariants()

  const variants = useMemo(() => dataRes?.data || [], [dataRes?.data])
  const totalCount = dataRes?.pagination?.total_count || 0
  const totalPages = Math.ceil(totalCount / limit)

  const getVariantValue = useCallback(
    (v: AdminVariantListItem): VariantDraft =>
      drafts[v.id] || {
        price: v.price,
        compare_price: v.compare_price,
        price_myr: v.price_myr ?? null,
        compare_price_myr: v.compare_price_myr ?? null,
        stock: v.stock,
        stock_my: v.stock_my ?? 0,
        is_active: v.is_active,
      },
    [drafts]
  )

  const isRowDirty = useCallback(
    (v: AdminVariantListItem) => {
      const draft = drafts[v.id]
      if (!draft) return false
      return (
        draft.price !== v.price ||
        draft.compare_price !== v.compare_price ||
        draft.price_myr !== (v.price_myr ?? null) ||
        draft.compare_price_myr !== (v.compare_price_myr ?? null) ||
        draft.stock !== v.stock ||
        draft.stock_my !== (v.stock_my ?? 0) ||
        draft.is_active !== v.is_active
      )
    },
    [drafts]
  )

  const dirtyVariantIds = useMemo(() => Object.keys(drafts), [drafts])

  const handleDraftChange = useCallback(
    (variantId: string, field: VariantDraftField, value: number | boolean | null) => {
      setDrafts((prev) => {
        const original = variants.find((item) => item.id === variantId)
        if (!original) return prev

        const currentDraft: VariantDraft = prev[variantId] || {
          price: original.price,
          compare_price: original.compare_price,
          price_myr: original.price_myr ?? null,
          compare_price_myr: original.compare_price_myr ?? null,
          stock: original.stock,
          stock_my: original.stock_my ?? 0,
          is_active: original.is_active,
        }

        const updated = { ...currentDraft, [field]: value }
        if (
          updated.price === original.price &&
          updated.compare_price === original.compare_price &&
          updated.price_myr === (original.price_myr ?? null) &&
          updated.compare_price_myr === (original.compare_price_myr ?? null) &&
          updated.stock === original.stock &&
          updated.stock_my === (original.stock_my ?? 0) &&
          updated.is_active === original.is_active
        ) {
          const next = { ...prev }
          delete next[variantId]
          return next
        }

        return { ...prev, [variantId]: updated }
      })
    },
    [variants]
  )

  const handleSaveSingle = useCallback(
    async (variant: AdminVariantListItem) => {
      const draft = drafts[variant.id]
      if (!draft) return
      try {
        const payload = buildVariantUpdatePayload(variant.id, draft)
        await updateSingleMutation.mutateAsync({ variantId: variant.id, data: payload })
        toast.success(`Varian ${variant.name} (${variant.sku}) berhasil disimpan`)
        setDrafts((prev) => {
          const next = { ...prev }
          delete next[variant.id]
          return next
        })
        refetch()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gagal menyimpan varian')
      }
    },
    [drafts, updateSingleMutation, refetch]
  )

  const handleResetSingle = useCallback((variantId: string) => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[variantId]
      return next
    })
  }, [])

  const handleSaveAll = useCallback(async () => {
    if (dirtyVariantIds.length === 0) return
    const updates = dirtyVariantIds.map((id) => buildVariantUpdatePayload(id, drafts[id]))
    try {
      await batchUpdateMutation.mutateAsync(updates)
      toast.success(`${updates.length} varian berhasil diperbarui`)
      setDrafts({})
      refetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui daftar varian')
    }
  }, [dirtyVariantIds, drafts, batchUpdateMutation, refetch])

  const handleResetAll = useCallback(() => setDrafts({}), [])

  const stats = useMemo(() => {
    const getStockVal = (v: AdminVariantListItem) =>
      marketMode === 'MY'
        ? drafts[v.id]?.stock_my ?? v.stock_my ?? 0
        : drafts[v.id]?.stock ?? v.stock
    return {
      totalItems: totalCount,
      outOfStockCount: variants.filter((v) => getStockVal(v) <= 0).length,
      lowStockCount: variants.filter((v) => {
        const st = getStockVal(v)
        return st > 0 && st <= 5
      }).length,
    }
  }, [totalCount, variants, drafts, marketMode])

  const columns = useStockPriceColumns({
    marketMode,
    getVariantValue,
    handleDraftChange,
    isRowDirty,
    handleSaveSingle,
    handleResetSingle,
    isSingleSaving: updateSingleMutation.isPending,
  })

  return (
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        title="Stok & Harga Varian"
        subtitle="Kelola harga jual, harga coret, dan stok varian secara terpisah untuk pasar Indonesia (Rp) dan Malaysia (RM)."
      >
        <div className="flex items-center space-x-3">
          {dirtyVariantIds.length > 0 && (
            <Button
              onClick={handleSaveAll}
              isLoading={batchUpdateMutation.isPending}
              className="bg-brand-gold hover:bg-brand-gold-hover text-brand-plum text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5 shadow-sm"
            >
              <HandDrawnIcon name="check" className="h-3.5 w-3.5 mr-1.5" /> Simpan Semua (
              {dirtyVariantIds.length})
            </Button>
          )}
          <Link href="/admin/produk">
            <Button
              variant="outline"
              className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-4 border-neutral-300"
            >
              <HandDrawnIcon name="kancing" className="h-3.5 w-3.5 mr-1.5" /> Daftar Produk
            </Button>
          </Link>
        </div>
      </AdminPageHeader>

      <StockPriceToolbar
        marketMode={marketMode}
        onMarketModeChange={(mode) => {
          setMarketMode(mode)
          setPage(1)
        }}
        stats={stats}
        dirtyCount={dirtyVariantIds.length}
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        stockFilter={stockFilter}
        onStockFilterChange={(val) => {
          setStockFilter(val)
          setPage(1)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val)
          setPage(1)
        }}
        sortBy={sortBy}
        onSortByChange={(val) => {
          setSortBy(val)
          setPage(1)
        }}
        limit={limit}
        onLimitChange={(val) => {
          setLimit(val)
          setPage(1)
        }}
        onResetAll={handleResetAll}
        onSaveAll={handleSaveAll}
        isBatchSaving={batchUpdateMutation.isPending}
      />

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
