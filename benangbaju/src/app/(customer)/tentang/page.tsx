import React from 'react'
import { Metadata } from 'next'
import Image from 'next/image'
import { PageHero, PageContainer } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Tentang Kami — Benangbaju',
  description:
    'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benangbaju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
}

export default function TentangPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow="Kisah & Visi"
        title="Tentang Kami"
        subtitle="Kenali perjalanan Benangbaju sebagai brand fashion asal Bandung yang memadukan kesederhanaan dan gaya unik."
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
                Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Sesuai dengan tagline
                kami,{' '}
                <span className="font-bold text-brand-plum">
                  &quot;Show How Really Well-Dressed You Are,&quot;
                </span>{' '}
                Benang Baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan
                diri lewat sepotong pakaian yang sederhana namun unik.
              </p>
              <p className="font-accent text-xl text-brand-plum">
                Ungkapkan kepribadian dan gaya unikmu dengan menggunakan produk dari Benangbaju.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="border border-neutral-200/80 p-6 md:p-8 space-y-3 bg-brand-cream rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 animate-slide-up">
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-plum">
                Kualitas
              </span>
              <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-sm">
                Bahan Premium Pilihan
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Kami menyeleksi bahan katun, linen, dan serat alam terbaik secara ketat. Pakaian
                kami didesain agar tetap adem, menyerap keringat, dan nyaman dipakai seharian di
                iklim tropis Indonesia.
              </p>
            </div>

            <div className="border border-neutral-200/80 p-6 md:p-8 space-y-3 bg-brand-cream rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 animate-slide-up">
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-plum">
                Craftsmanship
              </span>
              <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-sm">
                Jahitan Standar Butik
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Setiap pakaian dijahit secara presisi oleh pengrajin lokal berpengalaman. Kami
                memastikan keliman rapi, pola presisi, serta ketahanan jahitan yang kuat untuk
                investasi jangka panjang lemari pakaian Anda.
              </p>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-10 text-center animate-fade-in">
            <p className="text-sm md:text-base font-heading font-light uppercase tracking-[0.2em] text-brand-plum leading-relaxed">
              &ldquo;Show How Really Well-Dressed You Are&rdquo;
            </p>
            <div className="stitch-divider stitch-divider-center mt-4" />
            <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-heading mt-4">
              — Filosofi Benangbaju
            </p>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
