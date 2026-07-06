'use client'

import React from 'react'
import { ProductListItem } from '@/modules/products/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { SectionHeader } from '@/shared/components'
import { motion } from 'framer-motion'

interface RelatedProductsProps {
  products: ProductListItem[]
}

export function RelatedProducts({ products }: RelatedProductsProps): React.JSX.Element | null {
  if (products.length === 0) return null

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
    <div className="py-12 border-t border-neutral-100 space-y-8">
      <SectionHeader
        eyebrow="Rekomendasi Kami"
        title="Produk Serupa"
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
        {products.slice(0, 4).map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            className="w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
