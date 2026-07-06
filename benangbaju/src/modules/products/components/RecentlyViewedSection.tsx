'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRecentlyViewedStore } from '@/modules/products/stores/recentlyViewedStore'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { ProductListItem } from '@/modules/products/types'
import { PageContainer, SectionHeader } from '@/shared/components'

export function RecentlyViewedSection(): React.JSX.Element | null {
  const { products } = useRecentlyViewedStore()
  const [isMounted, setIsMounted] = useState(false)

  const displayProducts = useMemo(() => {
    const mappedProducts: ProductListItem[] = products.map((p) => {
      const variantList = [
        {
          id: '',
          sku: '',
          name: '',
          price: p.price,
          compare_price: null,
          stock: 99,
          weight_gram: null,
          is_active: true,
        },
      ]

      const imagesList = p.imageUrl
        ? [
            {
              id: 'primary',
              url: p.imageUrl,
              alt_text: p.name,
              sort_order: 0,
              is_primary: true,
            },
          ]
        : []

      return {
        id: p.id,
        category_id: '',
        name: p.name,
        slug: p.slug,
        is_featured: false,
        created_at: new Date().toISOString(),
        categories: null,
        product_variants: variantList,
        product_images: imagesList,
        minPrice: p.price,
        maxPrice: p.price,
        comparePrice: null,
        discountPercent: null,
        primaryImage: p.imageUrl || null,
        hoverImage: p.imageUrl || null,
        hasMultipleColors: false,
        sizeVariants: variantList,
      }
    })
    return mappedProducts.slice(0, 4)
  }, [products])

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  if (!isMounted || products.length === 0) return null

  return (
    <section className="bg-white py-16">
      <PageContainer>
        <SectionHeader eyebrow="Riwayat Anda" title="Terakhir Dilihat" />

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-x-4 gap-y-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </PageContainer>
    </section>
  )
}
