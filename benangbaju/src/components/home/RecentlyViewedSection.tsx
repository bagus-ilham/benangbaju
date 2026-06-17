'use client'

import React from 'react'
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductListItem } from '@/services/products'

export function RecentlyViewedSection() {
  const { products } = useRecentlyViewedStore()

  if (products.length === 0) return null

  // Map simple stored product items into the full ProductListItem shape for ProductCard
  const mappedProducts: ProductListItem[] = products.map((p) => ({
    id: p.id,
    category_id: '',
    name: p.name,
    slug: p.slug,
    description: null,
    short_description: null,
    weight_gram: 1000,
    is_featured: false,
    created_at: new Date().toISOString(),
    categories: null,
    product_variants: [
      {
        id: '',
        sku: '',
        name: '',
        price: p.price,
        compare_price: null,
        stock: 99, // default stock for viewed items
        weight_gram: null,
        is_active: true,
      },
    ],
    product_images: p.imageUrl
      ? [
          {
            id: 'primary',
            url: p.imageUrl,
            alt_text: p.name,
            sort_order: 0,
            is_primary: true,
          },
        ]
      : [],
  }))

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Riwayat Anda
          </span>
          <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
            Terakhir Dilihat
          </h2>
          <div className="w-8 h-[1px] bg-brand-black pt-1" />
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {mappedProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
