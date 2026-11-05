'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PageContainer, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import { useMarket } from '@/shared/stores/marketStore'

interface TrustItem {
  handDrawnName: HandDrawnIconName
  title: string
  description: string
}

const TRUST_ITEMS_ID: TrustItem[] = [
  {
    handDrawnName: 'truck',
    title: 'Gratis Ongkir',
    description: 'Tanpa minimum belanja',
  },
  {
    handDrawnName: 'sparkles',
    title: 'Bahan Premium',
    description: 'Kualitas terbaik & nyaman',
  },
  {
    handDrawnName: 'clothes',
    title: '100% Original',
    description: 'Produk resmi Benangbaju',
  },
  {
    handDrawnName: 'refresh',
    title: 'Retur Mudah',
    description: '7 hari setelah diterima',
  },
]

const TRUST_ITEMS_MY: TrustItem[] = [
  {
    handDrawnName: 'truck',
    title: 'West Malaysia Delivery',
    description: 'Direct from Bandung atelier',
  },
  {
    handDrawnName: 'sparkles',
    title: 'Premium Fabrics',
    description: 'Curated & comfortable cotton linen',
  },
  {
    handDrawnName: 'clothes',
    title: '100% Authentic',
    description: 'Official Benangbaju original',
  },
  {
    handDrawnName: 'shield-check',
    title: 'DuitNow QR Pay',
    description: "Touch 'n Go, MAE, CIMB supported",
  },
]

export function TrustStrip(): React.JSX.Element {
  const market = useMarket()
  const items = market === 'MY' ? TRUST_ITEMS_MY : TRUST_ITEMS_ID

  return (
    <section className="relative bg-brand-gold border-b border-brand-gold/80 py-3.5 md:py-6 overflow-hidden text-brand-plum">
      {/* Decorative Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none select-none bg-center bg-repeat"
        style={{ backgroundImage: 'url(/image/svg/decorative/pattern-stitch-card.svg)', backgroundSize: '240px' }}
        aria-hidden="true"
      />
      <PageContainer className="relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-nowrap items-center justify-between overflow-x-auto scrollbar-none snap-x gap-3 sm:gap-4 md:grid md:grid-cols-4 md:gap-6 py-1"
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUpItem}
              className="flex-none snap-start flex items-center text-left gap-2 md:gap-3 group"
            >
              <div className="flex-shrink-0 p-1.5 md:p-2 border border-brand-plum/30 bg-brand-plum/10 transition-all duration-300 group-hover:border-brand-plum group-hover:bg-brand-plum/20 rounded-xl group-hover:-translate-y-0.5">
                <HandDrawnIcon name={item.handDrawnName} className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 whitespace-nowrap">
                <h3 className="text-[10px] md:text-[11px] font-sans font-bold uppercase tracking-widest text-brand-plum">
                  {item.title}
                </h3>
                <p className="text-[9px] text-brand-plum/80 font-sans leading-relaxed hidden md:block">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </PageContainer>
    </section>
  )
}
