'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ProductCard } from '@/entities/product/ui/ProductCard'
import { ProductListItem } from '@/entities/product/model/product.types'
import { Button, PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ProductGridSectionProps {
  products: ProductListItem[]
  eyebrow?: string
  title: string
  viewAllHref?: string
  viewAllLabel?: string
  variant?: 'default' | 'alt' | 'dark'
  align?: 'center' | 'left'
}

export function ProductGridSection({
  products,
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel = 'Lihat Semua',
  variant = 'default',
  align = 'center',
}: ProductGridSectionProps): React.JSX.Element | null {
  if (products.length === 0) return null

  const bgClass =
    variant === 'dark'
      ? 'bg-brand-black border-neutral-800'
      : variant === 'alt'
        ? 'bg-brand-cream section-texture border-neutral-200'
        : 'bg-white border-neutral-100'

  const isDark = variant === 'dark'

  return (
    <section className={cn('py-14 md:py-16 border-b', bgClass)}>
      <PageContainer>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          align={align}
          className={isDark ? '[&_h2]:text-white [&_span]:text-brand-gold-light' : undefined}
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
              className="w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        {viewAllHref && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex justify-center mt-12"
          >
            <Link href={viewAllHref}>
              <Button
                variant={isDark ? 'secondary' : 'outline'}
                size="md"
                className={
                  isDark
                    ? 'bg-transparent text-white border-white/30 hover:bg-white hover:text-brand-black'
                    : undefined
                }
              >
                {viewAllLabel}
              </Button>
            </Link>
          </motion.div>
        )}
      </PageContainer>
    </section>
  )
}
