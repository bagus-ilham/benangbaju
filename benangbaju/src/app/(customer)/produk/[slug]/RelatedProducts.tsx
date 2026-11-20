'use client'

import React from 'react'
import { ProductListItem } from '@/modules/products/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PageContainer, ScallopEdge, SectionHeader } from '@/shared/components'
import { motion } from 'framer-motion'
import { useMarket } from '@/shared/stores/marketStore'

interface RelatedProductsProps {
  products: ProductListItem[]
}

export function RelatedProducts({ products }: RelatedProductsProps): React.JSX.Element | null {
  const market = useMarket()
  const isMY = market === 'MY'
  const visibleProducts = isMY ? products.filter((p) => p.isAvailableInMY) : products
  if (visibleProducts.length === 0) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="relative bg-brand-blue-soft pt-14 pb-20 md:pt-16 md:pb-24 mt-4">
      <ScallopEdge
        direction="up"
        fill="var(--color-brand-blue-soft)"
        stroke="var(--color-brand-blue-stroke)"
        strokeOpacity={0.55}
        className="absolute left-0 right-0 bottom-full mb-[-1px] pointer-events-none z-10"
      />

      <PageContainer className="space-y-8">
        <SectionHeader
          eyebrow={isMY ? 'Curated For You' : 'Rekomendasi Kami'}
          title={isMY ? 'You May Also Like' : 'Produk Serupa'}
          showDivider={true}
          align="center"
          className="mb-8"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="flex md:grid md:grid-cols-4 gap-x-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-none snap-x snap-mandatory w-full"
        >
          {visibleProducts.slice(0, 4).map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </PageContainer>
    </section>
  )
}
