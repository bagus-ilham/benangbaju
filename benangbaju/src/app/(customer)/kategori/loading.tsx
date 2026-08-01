import React from 'react'
import { PageContainer, PageHero } from '@/shared/components'

export default function KategoriLoading(): React.JSX.Element {
  return (
    <div className="bg-brand-cream min-h-screen">
      <PageHero
        eyebrow="Kategori"
        title="Jelajahi Kategori"
        subtitle="Temukan koleksi pakaian sederhana namun unik berdasarkan kategori pilihan Anda."
      />
      <PageContainer className="py-12 md:py-16 page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 md:h-96 w-full skeleton-shimmer rounded-2xl border border-neutral-200/80"
            />
          ))}
        </div>
      </PageContainer>
    </div>
  )
}
