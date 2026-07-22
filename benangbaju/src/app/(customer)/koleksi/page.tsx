import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveCollectionsAction } from '@/modules/collections/actions'
import { PageHero, PageContainer } from '@/shared/components'

import { cacheLife, cacheTag } from 'next/cache'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

async function getCachedCollections() {
  'use cache'
  cacheLife('weeks')
  cacheTag('collections')
  return getActiveCollectionsAction()
}

export default async function CollectionsIndexPage(): Promise<React.JSX.Element> {
  const collectionsRes = await getCachedCollections()
  const collections = collectionsRes.data || []

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow="Daftar Koleksi"
        title="Koleksi Spesial"
        subtitle="Jelajahi berbagai edisi dan koleksi produk kurasi premium dari Benangbaju."
        variant="dark"
      />

      <PageContainer className="py-12 md:py-16 page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/koleksi/${col.slug}`}
              className="group relative h-80 md:h-[28rem] w-full overflow-hidden bg-neutral-200 border border-neutral-100 card-hover-lift gold-border-hover block rounded-2xl"
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
              <div className="absolute inset-0 gradient-overlay-dark opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

              <div className="absolute top-4 left-4 px-3 py-1.5 bg-brand-accent/90 backdrop-blur-sm rounded-full">
                <span className="text-[9px] font-heading font-bold uppercase tracking-widest text-brand-black">
                  Koleksi
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 md:p-8 text-white text-center space-y-2 z-10">
                <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-widest leading-none">
                  {col.name}
                </h2>
                <div className="w-8 h-px bg-brand-accent-light group-hover:w-16 transition-all duration-500" />
                {col.description && (
                  <p className="text-[10px] text-neutral-300 font-sans line-clamp-2 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {col.description}
                  </p>
                )}
                <span className="text-[9px] font-heading uppercase tracking-[0.2em] text-brand-accent-light pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Lihat Koleksi &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </div>
  )
}
