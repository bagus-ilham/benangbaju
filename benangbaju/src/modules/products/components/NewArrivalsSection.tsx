'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { motion } from 'framer-motion'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { ProductListItem } from '@/modules/products/types'
import { Button, PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

interface NewArrivalsSectionProps {
  products: ProductListItem[]
}

export function NewArrivalsSection({
  products,
}: NewArrivalsSectionProps): React.JSX.Element | null {
  if (products.length === 0) return null

  return (
    <section className="bg-brand-black section-texture py-16 md:py-20 border-b border-neutral-800">
      <PageContainer>
        <SectionHeader
          eyebrow="Koleksi Terbaru"
          title="Keluaran Terbaru"
          className="[&_h2]:text-white"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="flex md:grid md:grid-cols-4 gap-x-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-none snap-x snap-mandatory w-full"
        >
          {products.slice(0, 4).map((product) => (
            <motion.div
              key={product.id}
              variants={fadeUpItem}
              className="w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start bg-white rounded-none p-2"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <Link href="/produk?urutkan=newest">
            <Button variant="secondary" size="lg" className="min-w-[200px]">
              Lihat Semua Koleksi Terbaru
            </Button>
          </Link>
        </motion.div>
      </PageContainer>
    </section>
  )
}
