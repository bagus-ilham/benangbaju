'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { motion } from 'framer-motion'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { ProductListItem } from '@/modules/products/types'
import { Button, PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import { useMarket } from '@/shared/stores/marketStore'
import { cn } from '@/lib/utils'

interface ProductShowcaseSectionProps {
  products: ProductListItem[]
  eyebrowId: string
  eyebrowMy: string
  titleId: string
  titleMy: string
  ctaLabelId: string
  ctaLabelMy: string
  ctaHref: string
  ctaSize?: 'md' | 'lg'
  ctaClassName?: string
  sectionClassName?: string
  headerClassName?: string
  cardWrapperClassName?: string
  showGradientMesh?: boolean
}

export function ProductShowcaseSection({
  products,
  eyebrowId,
  eyebrowMy,
  titleId,
  titleMy,
  ctaLabelId,
  ctaLabelMy,
  ctaHref,
  ctaSize = 'md',
  ctaClassName,
  sectionClassName,
  headerClassName,
  cardWrapperClassName,
  showGradientMesh = false,
}: ProductShowcaseSectionProps): React.JSX.Element | null {
  const market = useMarket()
  const isMY = market === 'MY'
  const visibleProducts = isMY ? products.filter((p) => p.isAvailableInMY) : products
  if (visibleProducts.length === 0) return null

  return (
    <section className={cn('relative bg-brand-cream font-sans', sectionClassName)}>
      {showGradientMesh && (
        <div className="absolute inset-0 gradient-mesh pointer-events-none" aria-hidden />
      )}

      <PageContainer className="relative">
        <SectionHeader
          eyebrow={isMY ? eyebrowMy : eyebrowId}
          title={isMY ? titleMy : titleId}
          className={headerClassName}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="flex md:grid md:grid-cols-4 gap-x-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-none snap-x snap-mandatory w-full"
        >
          {visibleProducts.slice(0, 4).map((product) => (
            <motion.div
              key={product.id}
              variants={fadeUpItem}
              className={cn(
                'w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start',
                cardWrapperClassName
              )}
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
          <Link href={ctaHref}>
            <Button variant="accent" size={ctaSize} className={cn('font-bold', ctaClassName)}>
              {isMY ? ctaLabelMy : ctaLabelId}
            </Button>
          </Link>
        </motion.div>
      </PageContainer>
    </section>
  )
}
