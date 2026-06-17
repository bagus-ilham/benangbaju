'use client'

import React from 'react'
import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/shared'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
  const { productIds } = useWishlist()

  // Fetch liked products directly using our hook with the ids array!
  const { data, isLoading } = useProducts({
    productIds: productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000'], // dummy UUID if empty to return empty list
    limit: 40,
  })

  const { products = [] } = data || {}

  const hasItems = productIds.length > 0 && products.length > 0

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="flex flex-col space-y-2 border-b border-neutral-100 pb-6 mb-10">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Koleksi Disukai
          </span>
          <h1 className="text-xl md:text-3xl font-heading font-light uppercase tracking-wider text-brand-black">
            Daftar Keinginan (Wishlist)
          </h1>
        </div>

        {isLoading ? (
          // Skeletons
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-neutral-100 animate-pulse w-full" />
                <div className="h-4 bg-neutral-100 animate-pulse w-2/3" />
                <div className="h-4 bg-neutral-50 animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : !hasItems ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="p-4 bg-brand-cream border border-brand-beige">
              <Heart className="h-8 w-8 text-neutral-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black">
                Daftar Keinginan Kosong
              </h3>
              <p className="text-xs text-neutral-400 font-sans max-w-xs leading-relaxed">
                Anda belum menambahkan produk apapun ke dalam daftar keinginan Anda.
              </p>
            </div>
            <Link href="/produk">
              <Button variant="primary" size="md">
                Cari Produk Pilihan
              </Button>
            </Link>
          </div>
        ) : (
          // Products Grid
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
