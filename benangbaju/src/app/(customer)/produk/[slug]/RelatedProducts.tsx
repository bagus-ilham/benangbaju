'use client'

import React from 'react'
import { ProductListItem } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'

interface RelatedProductsProps {
  products: ProductListItem[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null

  return (
    <div className="py-10 border-t border-neutral-100 space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
          Rekomendasi Kami
        </span>
        <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black">
          Produk Serupa
        </h3>
        <div className="w-8 h-[1px] bg-brand-black pt-1" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
