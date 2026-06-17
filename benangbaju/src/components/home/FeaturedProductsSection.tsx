'use client'

import React from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductListItem } from '@/services/products'
import { Button } from '@/components/shared'

interface FeaturedProductsSectionProps {
  products: ProductListItem[]
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="bg-white py-16 border-b border-neutral-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Kurasi Terbaik
          </span>
          <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
            Produk Pilihan
          </h2>
          <div className="w-8 h-[1px] bg-brand-black pt-1" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center mt-12">
          <Link href="/produk?sort=featured">
            <Button variant="outline" size="md">
              Lihat Semua Produk Pilihan
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
