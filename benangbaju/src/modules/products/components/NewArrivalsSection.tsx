'use client'

import React from 'react'
import { ProductListItem } from '@/modules/products/types'
import { ProductShowcaseSection } from './ProductShowcaseSection'

interface NewArrivalsSectionProps {
  products: ProductListItem[]
}

export function NewArrivalsSection({
  products,
}: NewArrivalsSectionProps): React.JSX.Element | null {
  return (
    <ProductShowcaseSection
      products={products}
      eyebrowId="Koleksi Terbaru"
      eyebrowMy="Fresh Drops"
      titleId="Keluaran Terbaru"
      titleMy="New Arrivals"
      ctaLabelId="Lihat Semua Koleksi Terbaru"
      ctaLabelMy="View All New Arrivals"
      ctaHref="/produk?urutkan=newest"
      ctaSize="lg"
      ctaClassName="min-w-[200px]"
      sectionClassName="section-texture pt-16 pb-20 md:pt-20 md:pb-24"
      headerClassName="[&_h2]:text-brand-plum"
      cardWrapperClassName="bg-brand-gold/75 border border-brand-gold-stroke/65 rounded-2xl p-2"
    />
  )
}
