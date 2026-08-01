import React from 'react'
import { PageContainer, PageHero } from '@/shared/components'

export default function KoleksiLoading(): React.JSX.Element {
  return (
    <div className="bg-brand-cream min-h-screen">
      <PageHero
        eyebrow="Daftar Koleksi"
        title="Koleksi Spesial"
        subtitle="Jelajahi berbagai edisi dan koleksi produk kurasi premium dari Benangbaju."
        variant="dark"
      />
      <PageContainer className="py-12 md:py-16 page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 md:h-[28rem] w-full skeleton-shimmer rounded-2xl border border-neutral-200/80"
            />
          ))}
        </div>
      </PageContainer>
    </div>
  )
}
