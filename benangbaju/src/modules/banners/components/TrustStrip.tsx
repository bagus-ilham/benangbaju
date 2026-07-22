'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Truck, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react'
import { PageContainer } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: 'Gratis Ongkir',
    description: 'Min. pembelian Rp 500.000',
  },
  {
    icon: Sparkles,
    title: 'Bahan Premium',
    description: 'Kualitas terbaik & nyaman',
  },
  {
    icon: ShieldCheck,
    title: '100% Original',
    description: 'Produk resmi Benangbaju',
  },
  {
    icon: RotateCcw,
    title: 'Retur Mudah',
    description: '7 hari setelah diterima',
  },
] as const

export function TrustStrip(): React.JSX.Element {
  return (
    <section className="bg-brand-black border-b border-neutral-800 py-3.5 md:py-8 overflow-hidden">
      <PageContainer>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-nowrap items-center justify-between overflow-x-auto scrollbar-none snap-x gap-3 sm:gap-4 md:grid md:grid-cols-4 md:gap-6 py-1"
        >
          {TRUST_ITEMS.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUpItem}
              className="flex-none snap-start flex items-center text-left gap-2 md:gap-3 group"
            >
              <div className="flex-shrink-0 p-1.5 md:p-2 border border-brand-accent/30 bg-brand-accent/10 transition-all duration-300 group-hover:border-brand-accent group-hover:bg-brand-accent/20 rounded-xl group-hover:-translate-y-0.5">
                <item.icon className="h-3.5 w-3.5 text-brand-accent-light" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 whitespace-nowrap">
                <h3 className="text-[9px] md:text-[10px] font-heading font-semibold uppercase tracking-widest text-white">
                  {item.title}
                </h3>
                <p className="text-[9px] text-neutral-400 font-sans leading-relaxed hidden md:block">
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
