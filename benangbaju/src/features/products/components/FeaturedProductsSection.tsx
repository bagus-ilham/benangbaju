'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ProductCard } from '@/entities/product/ui/ProductCard'
import { ProductListItem } from '@/entities/product/model/product.types'
import { Button, PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

interface FeaturedProductsSectionProps {
  products: ProductListItem[]
}

export function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps): React.JSX.Element | null {
  if (products.length === 0) return null

  return (
    <section className="relative bg-white py-16 md:py-20 border-b border-neutral-100 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" aria-hidden />

      <PageContainer className="relative">
        <SectionHeader eyebrow="Kurasi Terbaik" title="Produk Pilihan" />

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
              className="w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start"
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
          <Link href="/produk?urutkan=featured">
            <Button variant="primary" size="md">
              Lihat Semua Produk Pilihan
            </Button>
          </Link>
        </motion.div>
      </PageContainer>
    </section>
  )
}
