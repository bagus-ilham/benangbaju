'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PageHero, PageContainer } from '@/shared/components'
import { EASE_PREMIUM } from '@/lib/motion'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: EASE_PREMIUM },
}

export function TentangClient(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Kisah & Visi"
        title="Tentang Kami"
        subtitle="Kenali perjalanan Benangbaju sebagai brand fashion asal Bandung yang memadukan kesederhanaan dan gaya unik."
      />

      <PageContainer size="md" className="py-12 md:py-16 page-content">
        <div className="max-w-3xl mx-auto space-y-12">
          <motion.div
            {...fadeUp}
            className="space-y-6 text-sm leading-relaxed text-neutral-600 font-medium"
          >
            <p>
              Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Sesuai dengan tagline
              kami,{' '}
              <span className="font-semibold text-brand-black">
                "Show How Really Well-Dressed You Are,"
              </span>{' '}
              Benangbaju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri
              lewat sepotong pakaian yang sederhana namun unik.
            </p>
            <p>Ungkapkan kepribadian dan gaya unikmu dengan menggunakan produk dari Benangbaju.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="border border-neutral-200 p-6 md:p-8 space-y-3 card-hover-lift gold-border-hover bg-brand-cream/50"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-heading font-medium text-brand-gold">
                Kualitas
              </span>
              <h3 className="font-heading text-brand-black font-semibold uppercase tracking-wider text-sm">
                Bahan Premium Pilihan
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Kami menyeleksi bahan katun, linen, dan serat alam terbaik secara ketat. Pakaian
                kami didesain agar tetap adem, menyerap keringat, dan nyaman dipakai seharian di
                iklim tropis Indonesia.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="border border-neutral-200 p-6 md:p-8 space-y-3 card-hover-lift gold-border-hover bg-brand-cream/50"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-heading font-medium text-brand-gold">
                Craftsmanship
              </span>
              <h3 className="font-heading text-brand-black font-semibold uppercase tracking-wider text-sm">
                Jahitan Standar Butik
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Setiap pakaian dijahit secara presisi oleh pengrajin lokal berpengalaman. Kami
                memastikan keliman rapi, pola presisi, serta ketahanan jahitan yang kuat untuk
                investasi jangka panjang lemari pakaian Anda.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="border-t border-neutral-200 pt-10 text-center"
          >
            <p className="text-sm md:text-base font-heading font-light uppercase tracking-[0.2em] text-brand-black leading-relaxed">
              &ldquo;Show How Really Well-Dressed You Are&rdquo;
            </p>
            <div className="accent-line accent-line-center mt-4" />
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-heading mt-4">
              — Filosofi Benangbaju
            </p>
          </motion.div>
        </div>
      </PageContainer>
    </div>
  )
}
