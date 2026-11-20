'use client'

import React from 'react'
import Image from 'next/image'
import { Collection } from '@/modules/collections/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PageHero, PageContainer, EmptyState, ScallopEdge } from '@/shared/components'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { useMarket } from '@/shared/stores/marketStore'

interface CollectionDetailClientProps {
  collection: Collection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[]
}

export function CollectionDetailClient({
  collection,
  products,
}: CollectionDetailClientProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <div className="bg-brand-cream min-h-screen">
      {collection.image_url ? (
        <div className="relative h-[38vh] md:h-[52vh] w-full bg-brand-surface/60 overflow-hidden">
          <Image
            src={getProxiedImageUrl(collection.image_url)}
            alt={collection.name}
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
            <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
              <span className="inline-block text-lg md:text-xl font-accent font-bold text-brand-gold leading-none">
                {isMY ? 'Special Collection' : 'Koleksi Khusus'}
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-brand-cream mt-2 leading-tight">
                {collection.name}
              </h1>
              <div className="w-12 h-0.5 bg-brand-gold rounded-full mt-3" />
              {collection.description && (
                <p className="text-xs md:text-sm text-brand-cream/90 font-sans max-w-lg leading-relaxed mt-3">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
          <ScallopEdge
            direction="up"
            fill="var(--color-brand-cream)"
            className="absolute left-0 right-0 bottom-0 -mb-px z-20 pointer-events-none"
          />
        </div>
      ) : (
        <PageHero
          eyebrow={isMY ? 'Special Collection' : 'Koleksi Khusus'}
          title={collection.name}
          subtitle={collection.description || undefined}
        />
      )}

      <PageContainer className="pt-10 pb-20 md:pt-14 md:pb-24 page-content">
        {(() => {
          const visibleProducts = isMY ? products.filter((p) => p.isAvailableInMY) : products
          return visibleProducts.length === 0 ? (
            <EmptyState
              handDrawnIcon="package"
              title={isMY ? 'No Products Yet' : 'Belum Ada Produk'}
              description={
                isMY
                  ? 'There are no Malaysia-available products in this collection yet. Explore other collections.'
                  : 'Belum ada produk dalam koleksi ini. Coba jelajahi koleksi lain.'
              }
              action={{ label: isMY ? 'View All Collections' : 'Lihat Semua Koleksi', href: '/koleksi' }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        })()}
      </PageContainer>
    </div>
  )
}

