'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ProductListItem } from '@/modules/products/types'
import { Category } from '@/modules/categories/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import {
  PageContainer,
  PageHero,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/components'
import { CatalogDesktopFilters, CatalogMobileFilters } from './components'
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTransition } from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terkini' },
  { value: 'featured', label: 'Pilihan' },
  { value: 'price-low', label: 'Harga Terendah' },
  { value: 'price-high', label: 'Harga Tertinggi' },
  { value: 'popular', label: 'Terpopuler' },
]

interface CatalogClientProps {
  initialProducts: ProductListItem[]
  totalCount: number
  categories: Category[]
  filters: {
    categorySlug?: string
    sortBy?: string
    searchQuery?: string
    page?: number
    limit?: number
  }
}

export function CatalogClient({
  initialProducts,
  totalCount,
  categories,
  filters,
}: CatalogClientProps): React.JSX.Element {
  const router = useRouter()

  const { categorySlug, sortBy = 'newest', searchQuery, page = 1, limit = 12 } = filters

  // Local filter UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Update URL search params helpers
  const updateFilters = (newParams: Record<string, string | null>) => {
    // Generate new URL with search params
    const searchParams = new URLSearchParams()

    // Add existing filters
    if (categorySlug) searchParams.set('kategori', categorySlug)
    if (sortBy && sortBy !== 'newest') searchParams.set('urutkan', sortBy)
    if (searchQuery) searchParams.set('q', searchQuery)
    if (page > 1) searchParams.set('halaman', String(page))

    // Apply new params
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null) {
        searchParams.delete(key)
      } else {
        searchParams.set(key, val)
      }
    })

    // Always reset page to 1 on filter changes unless we are explicitly changing the page
    if (!newParams.halaman && searchParams.has('halaman')) {
      searchParams.delete('halaman')
    }

    const query = searchParams.toString()
    startTransition(() => {
      router.push(`/produk${query ? `?${query}` : ''}`)
    })
  }

  const handleCategorySelect = (slug: string | null) => {
    updateFilters({ kategori: slug })
  }

  const handleSortSelect = (val: string) => {
    updateFilters({ urutkan: val })
  }

  const handlePageSelect = (targetPage: number) => {
    updateFilters({ halaman: String(targetPage) })
  }

  const handleClearAll = () => {
    router.push('/produk')
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow="Katalog Busana"
        title="Semua Produk"
        subtitle="Jelajahi koleksi fashion muslim premium dengan desain minimalis dan bahan berkualitas."
      />
      <PageContainer
        className={cn(
          'py-10 page-content transition-opacity duration-300',
          isPending && 'opacity-50 pointer-events-none'
        )}
      >
        {searchQuery && (
          <p className="text-xs text-neutral-500 font-sans -mt-6 mb-8">
            Hasil pencarian untuk:{' '}
            <strong className="text-brand-black">&quot;{searchQuery}&quot;</strong> ({totalCount}{' '}
            produk)
          </p>
        )}

        {/* Toolbar (Mobile Filter Trigger & Desktop Sort) */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center space-x-2 text-xs font-heading font-semibold uppercase tracking-wider text-brand-black md:hidden py-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
          </button>

          <div className="hidden md:block" />

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-400">
              Urutkan:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 bg-transparent text-[10px] font-heading font-bold uppercase tracking-wider text-brand-black hover:text-brand-gold transition-colors p-1">
                  <span>
                    {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Urutkan'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="w-48">
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleSortSelect(opt.value)}
                    className={cn(
                      sortBy === opt.value && 'font-bold text-brand-black bg-neutral-50'
                    )}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* 1. Desktop Filters Sidebar */}
          <CatalogDesktopFilters
            categories={categories}
            categorySlug={categorySlug}
            searchQuery={searchQuery}
            handleCategorySelect={handleCategorySelect}
            handleClearAll={handleClearAll}
          />

          {/* 2. Mobile Filters Overlay */}
          <CatalogMobileFilters
            showMobileFilters={showMobileFilters}
            setShowMobileFilters={setShowMobileFilters}
            categories={categories}
            categorySlug={categorySlug}
            handleCategorySelect={handleCategorySelect}
            handleClearAll={handleClearAll}
          />

          {/* 3. Product Grid */}
          <div className="flex-1">
            {initialProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                  <PackageSearch className="w-8 h-8 text-neutral-300" />
                </div>
                <h3 className="text-lg font-heading font-bold text-neutral-900 mb-2">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-neutral-500 text-sm max-w-sm">
                  Maaf, tidak ada produk yang sesuai dengan kriteria pencarian Anda. Silakan coba
                  filter lain.
                </p>
                {(categorySlug || searchQuery) && (
                  <button
                    onClick={handleClearAll}
                    className="mt-6 text-xs font-heading font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-light"
                  >
                    Hapus Semua Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 lg:gap-y-12">
                {initialProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-16 pt-8 border-t border-neutral-100">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePageSelect(page - 1)}
                  className="p-2 border border-neutral-200 hover:border-brand-black bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-xs font-heading font-medium tracking-wide">
                  Halaman {page} dari {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => handlePageSelect(page + 1)}
                  className="p-2 border border-neutral-200 hover:border-brand-black bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
