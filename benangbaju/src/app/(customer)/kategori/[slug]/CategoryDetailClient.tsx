'use client'

import React from 'react'
import Image from 'next/image'
import { Category } from '@/modules/categories/types'
import { PageContainer, PageHero, EmptyState } from '@/shared/components'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { useMarket } from '@/shared/stores/marketStore'

interface CategoryDetailClientProps {
  category: Category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[]
}

export function CategoryDetailClient({
  category,
  products,
}: CategoryDetailClientProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <div className="bg-brand-cream min-h-screen">
      {category.image_url ? (
        <div className="relative h-[35vh] md:h-[45vh] w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
          <Image
            src={getProxiedImageUrl(category.image_url)}
            alt={category.name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-plum/90 via-brand-plum/40 to-transparent" />
          <div
            className="absolute inset-0 section-texture opacity-20 pointer-events-none"
            aria-hidden
          />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-brand-gold">
                {isMY ? 'Featured Category' : 'Kategori Pilihan'}
              </span>
              <h1 className="text-2xl md:text-4xl font-sans font-bold uppercase tracking-wider text-brand-cream mt-2 leading-tight">
                {category.name}
              </h1>
              <div className="w-12 h-0.5 bg-brand-gold mt-3" />
              {category.description && (
                <p className="text-xs text-neutral-300 font-sans max-w-lg leading-relaxed mt-3">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <PageHero
          eyebrow={isMY ? 'Featured Category' : 'Kategori Pilihan'}
          title={category.name}
          subtitle={category.description || undefined}
        />
      )}

      <PageContainer className="py-12 md:py-16 page-content">
        {products.length === 0 ? (
          <EmptyState
            handDrawnIcon="package"
            title={isMY ? 'No Products Yet' : 'Belum Ada Produk'}
            description={
              isMY
                ? 'There are no products in this category yet. Explore other categories.'
                : 'Belum ada produk dalam kategori ini. Coba jelajahi kategori lain.'
            }
            action={{ label: isMY ? 'View All Products' : 'Lihat Semua Produk', href: '/produk' }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}

