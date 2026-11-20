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

      <PageContainer size="md" className="pt-12 pb-20 md:pt-16 md:pb-24 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-8 bg-brand-gold/40 border border-brand-gold-stroke/45 rounded-3xl shadow-xs animate-slide-up">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="border border-brand-blue-stroke/60 p-6 md:p-8 space-y-3 bg-brand-blue-soft/55 rounded-3xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-slide-up">
              <span className="inline-block text-base font-accent font-bold text-brand-plum/80 leading-none">
                {isMY ? 'Value 01' : 'Nilai 01'}
              </span>
              <h2 className="text-xl font-serif font-medium tracking-tight text-brand-plum">
                {isMY ? 'Thoughtful Simplicity' : 'Kesederhanaan yang Bermakna'}
              </h2>
              <p className="text-xs md:text-sm text-brand-plum/80 leading-relaxed font-sans">
                {isMY
                  ? 'Apparel should complement your daily flow effortlessly without overcomplicating comfort.'
                  : 'Pakaian seharusnya melengkapi keseharianmu tanpa harus berlebihan, mengutamakan kenyamanan di setiap helai benang.'}
              </p>
            </div>

            <div className="border border-brand-blue-stroke/60 p-6 md:p-8 space-y-3 bg-brand-blue-soft/75 rounded-3xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-slide-up">
              <span className="inline-block text-base font-accent font-bold text-brand-plum/80 leading-none">
                {isMY ? 'Value 02' : 'Nilai 02'}
              </span>
              <h2 className="text-xl font-serif font-medium tracking-tight text-brand-plum">
                {isMY ? 'Bandung Craftsmanship' : 'Karakter Khas Bandung'}
              </h2>
              <p className="text-xs md:text-sm text-brand-plum/80 leading-relaxed font-sans">
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

