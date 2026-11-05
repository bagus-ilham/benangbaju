'use client'

import React from 'react'
import Image from 'next/image'
import { PageHero, PageContainer } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

export function TentangClient(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMY ? 'Our Story & Vision' : 'Kisah & Visi'}
        title={isMY ? 'About Us' : 'Tentang Kami'}
        subtitle={
          isMY
            ? 'Discover Benangbaju, a Bandung-born apparel brand blending timeless simplicity with unique contemporary details.'
            : 'Kenali perjalanan Benangbaju sebagai brand fashion asal Bandung yang memadukan kesederhanaan dan gaya unik.'
        }
      />

      <PageContainer size="md" className="py-12 md:py-16 page-content">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-8 bg-brand-cream border border-neutral-200/80 rounded-2xl shadow-xs animate-slide-up">
            <div className="relative w-16 h-16 shrink-0 opacity-90">
              <Image
                src="/image/svg/logo/logo-jarum-benang.svg"
                alt="Gulungan Benang Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-neutral-600 font-medium">
              <p>
                {isMY ? (
                  <>
                    Founded in Bandung in 2021, Benangbaju lives by the motto{' '}
                    <span className="font-bold text-brand-plum">
                      &quot;Show How Really Well-Dressed You Are.&quot;
                    </span>{' '}
                    We exist to help you express your true individuality through pieces that are thoughtfully simple yet distinctly charming.
                  </>
                ) : (
                  <>
                    Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Sesuai dengan tagline
                    kami,{' '}
                    <span className="font-bold text-brand-plum">
                      &quot;Show How Really Well-Dressed You Are,&quot;
                    </span>{' '}
                    Benang Baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan
                    diri lewat sepotong pakaian yang sederhana namun unik.
                  </>
                )}
              </p>
              <p className="font-accent text-xl text-brand-plum">
                {isMY
                  ? 'Express your genuine personality and distinct style with creations from Benangbaju.'
                  : 'Ungkapkan kepribadian dan gaya unikmu dengan menggunakan produk dari Benangbaju.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="border border-neutral-200/80 p-6 md:p-8 space-y-3 bg-brand-cream rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 animate-slide-up">
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-plum">
                {isMY ? 'Value 01' : 'Nilai 01'}
              </span>
              <h2 className="text-base font-heading font-bold text-brand-plum">
                {isMY ? 'Thoughtful Simplicity' : 'Kesederhanaan yang Bermakna'}
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                {isMY
                  ? 'Apparel should complement your daily flow effortlessly without overcomplicating comfort.'
                  : 'Pakaian seharusnya melengkapi keseharianmu tanpa harus berlebihan, mengutamakan kenyamanan di setiap helai benang.'}
              </p>
            </div>

            <div className="border border-neutral-200/80 p-6 md:p-8 space-y-3 bg-brand-cream rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 animate-slide-up">
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-plum">
                {isMY ? 'Value 02' : 'Nilai 02'}
              </span>
              <h2 className="text-base font-heading font-bold text-brand-plum">
                {isMY ? 'Bandung Craftsmanship' : 'Karakter Khas Bandung'}
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                {isMY
                  ? 'Lovingly crafted in Bandung with curated fabrics and meticulous stitching to bring timeless wardrobe essentials.'
                  : 'Dibuat dengan cermat di Bandung, memadukan bahan pilihan dan detail jahitan rapi yang awet untuk dikenakan kapan pun.'}
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
