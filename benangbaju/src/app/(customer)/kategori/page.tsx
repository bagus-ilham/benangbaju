import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveCategories } from '@/features/marketing/services/categories'
import { PageHero, PageContainer } from '@/shared/components'

import { cacheLife, cacheTag } from 'next/cache'

async function getCachedCategories() {
  'use cache'
  cacheLife('weeks')
  cacheTag('categories')
  const supabase = createStaticClient()
  return getActiveCategories(supabase)
}

export default async function CategoriesIndexPage() : Promise<React.JSX.Element> {
  const categories = await getCachedCategories()
  const parentCategories = categories.filter((cat) => !cat.parent_id)

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow="Daftar Kategori"
        title="Kategori Pilihan"
        subtitle="Temukan koleksi busana muslim terbaik berdasarkan kategori pilihan Anda."
      />

      <PageContainer className="py-12 md:py-16 page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {parentCategories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative h-80 md:h-96 w-full overflow-hidden bg-neutral-200 border border-neutral-100 card-hover-lift gold-border-hover block"
            >
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-w-7xl) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400">{cat.name}</span>
                </div>
              )}
              <div className="absolute inset-0 gradient-overlay-dark opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

              <div className="absolute top-4 left-4 px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-[9px] font-heading font-semibold uppercase tracking-widest text-white/90">
                  0{index + 1}
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 md:p-8 text-white text-center space-y-2 z-10">
                <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-widest leading-none">
                  {cat.name}
                </h2>
                <div className="w-8 h-px bg-brand-gold-light group-hover:w-16 transition-all duration-500" />
                {cat.description && (
                  <p className="text-[10px] text-neutral-300 font-sans line-clamp-2 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {cat.description}
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
