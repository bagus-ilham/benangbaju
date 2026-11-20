'use client'

import React from 'react'
import { ProductListItem } from '@/modules/products/types'
import { ProductShowcaseSection } from './ProductShowcaseSection'

interface FeaturedProductsSectionProps {
  products: ProductListItem[]
}

export function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps): React.JSX.Element | null {
  return (
    <ProductShowcaseSection
      products={products}
      eyebrowId="Kurasi Terbaik"
      eyebrowMy="Best Curation"
      titleId="Produk Pilihan"
      titleMy="Featured Pieces"
      ctaLabelId="Lihat Semua Produk Pilihan"
      ctaLabelMy="View All Featured"
      ctaHref="/produk?urutkan=featured"
      sectionClassName="py-16 md:py-20 overflow-hidden"
      showGradientMesh
    />
  )
}
