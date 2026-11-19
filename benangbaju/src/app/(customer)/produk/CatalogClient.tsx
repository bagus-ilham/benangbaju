'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ProductListItem } from '@/modules/products/types'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { Category } from '@/modules/categories/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import {
  PageContainer,
  PageHero,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  EmptyState,
  HandDrawnIcon,
  Pagination,
} from '@/shared/components'
import { CatalogDesktopFilters, CatalogMobileFilters } from './components'
import { cn } from '@/lib/utils'
import { useTransition } from 'react'
import { useMarket } from '@/shared/stores/marketStore'

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
  const market = useMarket()
  const isMY = market === 'MY'
  const router = useRouter()

  const { categorySlug, sortBy = 'newest', searchQuery, page = 1, limit = 12 } = filters

  // Fetch Malaysia-filtered & Malaysia-price-sorted catalog directly from DB when in MY mode
  const { data: myProductsRes, isLoading: isMyLoading } = useProducts(
    {
      categorySlug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sortBy: sortBy as any,
      searchQuery,
      page,
      limit,
      market: 'MY',
    },
    { enabled: isMY }
  )

  const activeProducts = isMY
    ? myProductsRes?.data ?? initialProducts.filter((p) => p.isAvailableInMY)
    : initialProducts
  const activeTotalCount = isMY
    ? myProductsRes?.pagination?.total_count ?? activeProducts.length
    : totalCount

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

  const totalPages = Math.ceil(activeTotalCount / limit)

  return (
    <div className="bg-brand-cream min-h-screen">
      <PageHero
        eyebrow={isMY ? 'Apparel Catalog' : 'Katalog Pakaian'}
        title={isMY ? (categorySlug ? 'Product Category' : 'Our Collection') : (categorySlug ? 'Kategori Produk' : 'Koleksi Kami')}
        subtitle={isMY ? 'Explore simple yet distinctively crafted apparel by Benangbaju.' : 'Jelajahi koleksi pakaian sederhana namun unik dari Benangbaju.'}
      />
      <PageContainer
        className={cn(
          'pt-10 pb-20 md:pb-24 page-content transition-opacity duration-300',
          (isPending || (isMY && isMyLoading)) && 'opacity-50 pointer-events-none'
        )}
      >
        {searchQuery && (
          <p className="text-xs text-neutral-500 font-sans -mt-6 mb-8">
            {isMY ? 'Search results for:' : 'Hasil pencarian untuk:'}{' '}
            <strong className="text-brand-plum">&quot;{searchQuery}&quot;</strong> ({activeTotalCount}{' '}
            {isMY ? 'items' : 'produk'})
          </p>
        )}

        {/* Toolbar (Mobile Filter Trigger & Desktop Sort) */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-plum/10">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center space-x-2 text-xs font-sans font-bold uppercase tracking-wider text-brand-plum bg-brand-gold-soft/60 border border-brand-gold-stroke/40 px-3.5 py-2 rounded-full md:hidden cursor-pointer"
          >
            <HandDrawnIcon name="sliders" className="h-4 w-4" />
            <span>{isMY ? 'Filter' : 'Filter'}</span>
          </button>

          <div className="hidden md:block" />

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-600">
              {isMY ? 'Sort:' : 'Urutkan:'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1.5 bg-white/80 hover:bg-brand-gold-soft/50 border border-brand-plum/15 text-[10px] font-sans font-bold uppercase tracking-wider text-brand-plum transition-colors px-3 py-1.5 rounded-full cursor-pointer shadow-2xs">
                  <span>
                    {
                    (() => {
                      const found = SORT_OPTIONS.find((opt) => opt.value === sortBy)
                      if (!found) return isMY ? 'Sort' : 'Urutkan'
                      if (!isMY) return found.label
                      const enMap: Record<string, string> = {
                        newest: 'Newest',
                        featured: 'Featured',
                        'price-low': 'Price: Low to High',
                        'price-high': 'Price: High to Low',
                        popular: 'Most Popular',
                      }
                      return enMap[found.value] || found.label
                    })()
                  }
                  </span>
                  <HandDrawnIcon name="chevron-down" className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="w-48">
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleSortSelect(opt.value)}
                    className={cn(
                      sortBy === opt.value && 'font-bold text-brand-plum bg-brand-blue/15'
                    )}
                  >
                    {
                    isMY ? ({
                      newest: 'Newest',
                      featured: 'Featured',
                      'price-low': 'Price: Low to High',
                      'price-high': 'Price: High to Low',
                      popular: 'Most Popular',
                    }[opt.value] || opt.label) : opt.label
                  }
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filter Chips / Pills Bar */}
        {(categorySlug || searchQuery || (sortBy && sortBy !== 'newest')) && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3.5 bg-brand-gold-soft/55 border border-brand-gold-stroke/40 rounded-2xl">
            <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-brand-plum/75">
              {isMY ? 'Active Filters:' : 'Filter Aktif:'}
            </span>

            {categorySlug && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-sans bg-brand-cream border border-brand-plum/15 text-brand-plum px-2.5 py-1 rounded-full shadow-2xs">
                <span>
                  {isMY ? 'Category: ' : 'Kategori: '}{categories.find((c) => c.slug === categorySlug)?.name || categorySlug}
                </span>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className="hover:text-red-500 transition-colors ml-1 cursor-pointer"
                  aria-label="Hapus filter kategori"
                >
                  ✕
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-sans bg-brand-cream border border-brand-plum/15 text-brand-plum px-2.5 py-1 rounded-full shadow-2xs">
                <span>{isMY ? 'Search: ' : 'Cari: '}&quot;{searchQuery}&quot;</span>
                <button
                  onClick={() => updateFilters({ q: null })}
                  className="hover:text-red-500 transition-colors ml-1 cursor-pointer"
                  aria-label="Hapus filter pencarian"
                >
                  ✕
                </button>
              </span>
            )}

            {sortBy && sortBy !== 'newest' && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-sans bg-brand-cream border border-brand-plum/15 text-brand-plum px-2.5 py-1 rounded-full shadow-2xs">
                <span>{isMY ? 'Sort: ' : 'Urutan: '}{SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}</span>
                <button
                  onClick={() => handleSortSelect('newest')}
                  className="hover:text-red-500 transition-colors ml-1 cursor-pointer"
                  aria-label="Hapus filter urutan"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              onClick={handleClearAll}
              className="text-[10px] font-heading font-semibold uppercase tracking-wider text-brand-plum/70 hover:text-brand-plum underline underline-offset-2 transition-colors ml-auto"
            >
              {isMY ? 'Clear All' : 'Hapus Semua'}
            </button>
          </div>
        )}

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
            {(() => {
              const visibleProducts = isMY
                ? activeProducts.filter((p) => p.isAvailableInMY)
                : activeProducts
              return visibleProducts.length === 0 ? (
                <EmptyState
                  handDrawnIcon="package"
                  title={isMY ? 'No Products Found' : 'Produk Tidak Ditemukan'}
                  description={
                    isMY
                      ? 'No products are currently available for Malaysia matching your selection. Check back soon or adjust your filters.'
                      : 'Maaf, belum ada produk yang sesuai dengan filter atau pencarian Anda. Coba atur ulang filter untuk melihat koleksi lainnya.'
                  }
                  action={
                    categorySlug || searchQuery
                      ? { label: isMY ? 'Show All Products' : 'Tampilkan Semua Produk', onClick: handleClearAll }
                      : undefined
                  }
                  className="py-12 md:py-20"
                />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 lg:gap-y-12">
                  {visibleProducts.map((product, index) => (
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
              )
            })()}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-16 pt-8 border-t border-neutral-100 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => handlePageSelect(p)}
                />
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
