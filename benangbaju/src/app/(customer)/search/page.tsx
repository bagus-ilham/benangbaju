'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/product/ProductCard'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const { data, isLoading } = useProducts({
    searchQuery: query || undefined,
    limit: 40,
  })

  const { products = [], totalCount = 0 } = data || {}

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col space-y-2 border-b border-neutral-100 pb-6 mb-8">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Hasil Pencarian
          </span>
          <h1 className="text-xl md:text-3xl font-heading font-light uppercase tracking-wider text-brand-black">
            Pencarian: "{query}"
          </h1>
          <p className="text-xs text-neutral-500 font-sans">
            Ditemukan <strong className="text-brand-black">{totalCount}</strong> produk yang cocok.
          </p>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-neutral-100 animate-pulse w-full" />
                <div className="h-4 bg-neutral-100 animate-pulse w-2/3" />
                <div className="h-4 bg-neutral-50 animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-400 font-sans italic">
            Tidak ditemukan produk yang cocok dengan kata kunci "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-xs text-neutral-400 uppercase tracking-widest font-heading">
        Mencari produk...
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}
