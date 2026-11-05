'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { PageHero, PageContainer } from '@/shared/components'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { useMarket } from '@/shared/stores/marketStore'
import type { Collection } from '@/modules/collections/types'

interface CollectionsClientProps {
  collections: Collection[]
}

export function CollectionsClient({ collections }: CollectionsClientProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <div className="bg-brand-cream min-h-screen">
      <PageHero
        eyebrow={isMY ? 'Collections' : 'Daftar Koleksi'}
        title={isMY ? 'Curated Collections' : 'Koleksi Spesial'}
        subtitle={
          isMY
            ? 'Explore our limited editions and curated apparel series by Benangbaju.'
            : 'Jelajahi berbagai edisi dan koleksi produk kurasi premium dari Benangbaju.'
        }
        variant="dark"
      />

      <PageContainer className="py-12 md:py-16 page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/koleksi/${col.slug}`}
              className="group relative h-80 md:h-[28rem] w-full overflow-hidden bg-neutral-200 border border-neutral-200/80 block rounded-2xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              {col.image_url ? (
                <Image
                  src={getProxiedImageUrl(col.image_url)}
                  alt={col.name}
                  fill
                  sizes="(max-w-7xl) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                    {col.name}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-plum/80 via-brand-plum/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500 z-15" />

              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 md:p-8 text-white text-center space-y-2 z-10">
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-brand-gold">
                  {isMY ? 'Curated Collection' : 'Koleksi Terpilih'}
                </span>
                <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-widest leading-none">
                  {col.name}
                </h2>
                <div className="w-8 h-px bg-brand-accent-light group-hover:w-16 transition-all duration-500" />
                {col.description && (
                  <p className="text-[10px] text-neutral-300 font-sans line-clamp-2 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {col.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </div>
  )
}
