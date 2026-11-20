'use client'

import React from 'react'
import { AdminSearchInput, Button, HandDrawnIcon } from '@/shared/components'
import { cn } from '@/lib/utils'

export type StockFilterType = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
export type StatusFilterType = 'all' | 'active' | 'inactive'
export type SortByType = 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'

interface StockPriceToolbarProps {
  marketMode: 'ID' | 'MY'
  onMarketModeChange: (mode: 'ID' | 'MY') => void
  stats: {
    totalItems: number
    lowStockCount: number
    outOfStockCount: number
  }
  dirtyCount: number
  search: string
  onSearchChange: (val: string) => void
  stockFilter: StockFilterType
  onStockFilterChange: (val: StockFilterType) => void
  statusFilter: StatusFilterType
  onStatusFilterChange: (val: StatusFilterType) => void
  sortBy: SortByType
  onSortByChange: (val: SortByType) => void
  limit: number
  onLimitChange: (val: number) => void
  onResetAll: () => void
  onSaveAll: () => void
  isBatchSaving: boolean
}

export function StockPriceToolbar({
  marketMode,
  onMarketModeChange,
  stats,
  dirtyCount,
  search,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  limit,
  onLimitChange,
  onResetAll,
  onSaveAll,
  isBatchSaving,
}: StockPriceToolbarProps): React.JSX.Element {
  return (
    <>
      {/* Market Mode Switcher (ID vs MY) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-cream border border-neutral-200 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMarketModeChange('ID')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 border',
              marketMode === 'ID'
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            )}
          >
            <span>🇮🇩</span> Stok &amp; Harga Indonesia (IDR)
          </button>
          <button
            type="button"
            onClick={() => onMarketModeChange('MY')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 border',
              marketMode === 'MY'
                ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-emerald-300'
            )}
          >
            <span>🇲🇾</span> Stok &amp; Harga Malaysia (MYR)
          </button>
        </div>
        {marketMode === 'MY' && (
          <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
            Varian tanpa Harga RM (kosong) otomatis disembunyikan di katalog Malaysia. Stok MY dikelola manual di sini.
          </p>
        )}
      </div>

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
            Stok Menipis 1-5 (Hal. ini)
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStockCount}</p>
        </div>
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[11px] font-heading uppercase tracking-wider text-red-700 font-semibold">
            Stok Habis 0 (Hal. ini)
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockCount}</p>
        </div>
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[11px] font-heading uppercase tracking-wider text-emerald-700 font-semibold">
            Perubahan Belum Disimpan
          </p>
          <p className="text-2xl font-bold text-brand-plum mt-1">{dirtyCount}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:space-x-4">
        <div className="flex-1 max-w-md">
          <AdminSearchInput
            placeholder="Cari nama produk, nama varian, atau SKU..."
            value={search}
            onChange={onSearchChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value as StockFilterType)}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value="all">Semua Stok</option>
            <option value="in_stock">Stok Tersedia (&gt;0)</option>
            <option value="low_stock">Stok Menipis (1-5)</option>
            <option value="out_of_stock">Stok Habis (0)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilterType)}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value="all">Semua Status</option>
            <option value="active">Status: Aktif</option>
            <option value="inactive">Status: Nonaktif</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortByType)}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value="newest">Urutan: Terbaru</option>
            <option value="name_asc">Nama (A - Z)</option>
            <option value="price_asc">Harga (Rendah - Tinggi)</option>
            <option value="price_desc">Harga (Tinggi - Rendah)</option>
            <option value="stock_asc">Stok (Sedikit - Banyak)</option>
            <option value="stock_desc">Stok (Banyak - Sedikit)</option>
          </select>

          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-plum"
          >
            <option value={20}>20 / Halaman</option>
            <option value={50}>50 / Halaman</option>
            <option value={100}>100 / Halaman</option>
            <option value={200}>200 / Halaman</option>
          </select>
        </div>
      </div>

      {/* Dirty Draft Bar Warning */}
      {dirtyCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-slide-up">
          <div className="flex items-center space-x-2 text-amber-900">
            <HandDrawnIcon name="edit" className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold">
              Terdapat <strong>{dirtyCount}</strong> varian yang belum disimpan.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onResetAll}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-amber-100/60 transition"
            >
              Batalkan Semua
            </button>
            <Button
              size="sm"
              onClick={onSaveAll}
              isLoading={isBatchSaving}
              className="bg-brand-gold hover:bg-brand-gold-hover text-brand-plum font-bold uppercase text-[11px] px-4 py-2"
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
