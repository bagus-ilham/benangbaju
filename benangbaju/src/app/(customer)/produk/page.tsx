'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useProducts } from '@/hooks/useProducts'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { getActiveCategories } from '@/services/categories'
import { ProductCard } from '@/components/product/ProductCard'
import { Button, PageContainer, PageHeader, ProductGridSkeleton, EmptyState, PageHero } from '@/components/shared'
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

function CatalogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  // 1. Read filters from URL params
  const categorySlug = searchParams.get('kategori') || undefined
  const sortParam = searchParams.get('urutkan')
  const sortBy = sortParam === 'price-low' || sortParam === 'price-high' || sortParam === 'popular' || sortParam === 'featured'
    ? sortParam
    : 'newest'
  const searchQuery = searchParams.get('q') || undefined
  const page = Number(searchParams.get('halaman')) || 1
  const limit = 12

  // 2. Local filter UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // 3. Fetch products using React Query hook
  const { data, isLoading, isError } = useProducts({
    categorySlug,
    searchQuery,
    sortBy,
    page,
    limit,
  })

  const { products = [], totalCount = 0 } = data || {}

  // 4. Fetch all active categories for the sidebar filter
  const { data: categories = [], isError: isCategoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getActiveCategories(supabase),
  })

  if (isError || isCategoriesError) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero
          eyebrow="Katalog Busana"
          title="Semua Produk"
          subtitle="Jelajahi koleksi fashion muslim premium dengan desain minimalis dan bahan berkualitas."
        />
        <PageContainer className="py-10 page-content">
          <EmptyState
            icon="PackageSearch"
            title="Gagal Memuat Produk"
            description="Terjadi kesalahan saat memuat produk atau kategori dari server. Silakan coba kembali."
            action={{
              label: "Coba Lagi",
              onClick: () => window.location.reload()
            }}
          />
        </PageContainer>
      </div>
    )
  }

  // 5. Update URL search params helpers
  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null) {
        params.delete(key)
      } else {
        params.set(key, val)
      }
    })
    
    // Always reset page to 1 on filter changes
    if (!newParams.halaman) {
      params.delete('halaman')
    }

    router.push(`/produk?${params.toString()}`)
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
      <PageContainer className="py-10 page-content">
        {searchQuery && (
          <p className="text-xs text-neutral-500 font-sans -mt-6 mb-8">
            Hasil pencarian untuk: <strong className="text-brand-black">"{searchQuery}"</strong> ({totalCount} produk)
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
            <select
              value={sortBy}
              onChange={(e) => handleSortSelect(e.target.value)}
              className="bg-transparent text-xs font-heading font-medium uppercase tracking-wider border-none focus:ring-0 py-1 pl-0 pr-8 text-brand-black cursor-pointer"
            >
              <option value="newest">Terkini</option>
              <option value="featured">Pilihan</option>
              <option value="price-low">Harga Terendah</option>
              <option value="price-high">Harga Tertinggi</option>
              <option value="popular">Terpopuler</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* 1. Desktop Filters Sidebar */}
          <aside className="hidden md:block w-48 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Kategori
              </h3>
              {(categorySlug || searchQuery) && (
                <button
                  onClick={handleClearAll}
                  className="text-[9px] font-heading font-semibold uppercase tracking-widest text-neutral-400 hover:text-brand-black"
                >
                  Reset
                </button>
              )}
            </div>
            
            <ul className="space-y-2 border-b border-neutral-100 pb-6">
              <li>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={cn(
                    'text-xs font-sans tracking-wide hover:text-brand-black text-left w-full py-1',
                    !categorySlug ? 'text-brand-black font-semibold' : 'text-neutral-500'
                  )}
                >
                  Semua Kategori
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={cn(
                      'text-xs font-sans tracking-wide hover:text-brand-black text-left w-full py-1',
                      categorySlug === cat.slug ? 'text-brand-black font-semibold' : 'text-neutral-500'
                    )}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* 2. Mobile Filters Sidebar (Drawer Overlay) */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div
                className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="relative flex w-full max-w-xs flex-col bg-white py-4 shadow-xl border-r border-neutral-100">
                <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-100">
                  <span className="font-heading text-xs font-bold tracking-[0.15em] text-brand-black uppercase">
                    FILTER
                  </span>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-neutral-400 hover:text-brand-black p-1"
                    aria-label="Tutup filter"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div>
                    <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black mb-4">
                      Kategori
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <button
                          onClick={() => {
                            handleCategorySelect(null)
                            setShowMobileFilters(false)
                          }}
                          className={cn(
                            'text-xs tracking-wide text-left w-full',
                            !categorySlug ? 'text-brand-black font-semibold' : 'text-neutral-500'
                          )}
                        >
                          Semua Kategori
                        </button>
                      </li>
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <button
                            onClick={() => {
                              handleCategorySelect(cat.slug)
                              setShowMobileFilters(false)
                            }}
                            className={cn(
                              'text-xs tracking-wide text-left w-full',
                              categorySlug === cat.slug ? 'text-brand-black font-semibold' : 'text-neutral-500'
                            )}
                          >
                            {cat.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 border-t border-neutral-100 bg-neutral-50">
                  <Button
                    onClick={() => {
                      handleClearAll()
                      setShowMobileFilters(false)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Hapus Semua Filter
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Product Listings Grid */}
          <div className="flex-1">
            {isLoading ? (
              <ProductGridSkeleton count={6} />
            ) : products.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="Produk Tidak Ditemukan"
                description="Tidak ditemukan produk yang cocok dengan kriteria filter Anda."
                action={{ label: 'Reset Filter', onClick: handleClearAll, variant: 'outline' }}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                {products.map((product, index) => (
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

export default function CatalogPage() : React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-xs text-neutral-400 uppercase tracking-widest font-heading">
        Memuat katalog...
      </div>
    }>
      <CatalogContent />
    </Suspense>
  )
}
