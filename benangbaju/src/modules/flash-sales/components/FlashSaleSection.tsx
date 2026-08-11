'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { SmartLink as Link } from '@/shared/components'
import { motion } from 'framer-motion'
import { FlashSaleDetail } from '@/modules/flash-sales/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { ProductListItem } from '@/modules/products/types'
import { Button, PageContainer, SectionHeader } from '@/shared/components'

interface FlashSaleSectionProps {
  flashSale: FlashSaleDetail | null
  isFullPage?: boolean
}

export function FlashSaleSection({ flashSale, isFullPage = false }: FlashSaleSectionProps): React.JSX.Element | null {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  const mappedProducts: ProductListItem[] = useMemo(() => {
    if (!flashSale || !flashSale.flash_sale_items) return []

    // Group flash_sale_items by product ID to avoid duplicate cards for variants
    const productGroupMap = new Map<string, typeof flashSale.flash_sale_items>()

    for (const item of flashSale.flash_sale_items) {
      const prodId = item.product_variants?.products?.id
      if (!prodId) continue
      const existing = productGroupMap.get(prodId) || []
      existing.push(item)
      productGroupMap.set(prodId, existing)
    }

    const result: ProductListItem[] = []

    for (const [prodId, items] of productGroupMap.entries()) {
      if (items.length === 0) continue
      const firstItem = items[0]
      const pv = firstItem.product_variants
      const prod = pv?.products

      if (!prod) continue

      const images =
        prod.product_images?.map(
          (img: { url: string; alt_text?: string | null; is_primary?: boolean }, idx: number) => ({
            id: String(idx),
            url: img.url,
            alt_text: img.alt_text || prod.name,
            sort_order: idx,
            is_primary: img.is_primary ?? false,
          })
        ) || []

      const primaryImage = images.find((img) => img.is_primary)?.url || images[0]?.url || null
      const hoverImage =
        images.find((img) => !img.is_primary && img.sort_order > 0)?.url ||
        images[1]?.url ||
        primaryImage

      const variantList = items.map((item) => ({
        id: item.product_variants?.id || '',
        sku: item.product_variants?.sku || '',
        name: item.product_variants?.name || '',
        price: Number(item.sale_price),
        compare_price: Number(item.original_price),
        stock: item.product_variants?.stock || 0,
        weight_gram: null,
        is_active: true,
      }))

      const prices = items.map((i) => Number(i.sale_price))
      const comparePrices = items.map((i) => Number(i.original_price)).filter(Boolean)

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const comparePrice = comparePrices.length > 0 ? Math.max(...comparePrices) : null

      const discountPercent =
        comparePrice && comparePrice > minPrice
          ? Math.round(((comparePrice - minPrice) / comparePrice) * 100)
          : null

      result.push({
        id: prodId,
        category_id: '',
        name: prod.name || 'Produk Flash Sale',
        slug: prod.slug || '',
        is_featured: false,
        created_at: new Date().toISOString(),
        categories: null,
        product_variants: variantList,
        product_images: images,
        minPrice,
        maxPrice,
        comparePrice,
        discountPercent,
        primaryImage,
        hoverImage,
        hasMultipleColors: false,
        sizeVariants: variantList,
      })
    }

    return result
  }, [flashSale])

  useEffect(() => {
    if (!flashSale) return

    const calculateTimeLeft = () => {
      const difference = +new Date(flashSale.ends_at) - +new Date()

      if (difference <= 0) {
        setTimeLeft(null)
        return
      }

      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [flashSale])

  if (!flashSale || !timeLeft) return null

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  const displayProducts = isFullPage ? mappedProducts : mappedProducts.slice(0, 4)

  return (
    <section className="relative bg-brand-gold py-16 md:py-20 border-b border-brand-gold/80 overflow-hidden text-brand-plum">

      <PageContainer className="relative z-20">
        <SectionHeader
          align="left"
          showDivider={false}
          eyebrow="Penawaran Terbatas"
          title={flashSale.name || 'Flash Sale'}
          className="md:flex-row md:items-end md:justify-between md:mb-8 [&>span:first-child]:text-brand-plum [&_h2]:text-brand-plum"
        >
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-[11px] uppercase tracking-wider font-sans font-semibold text-brand-cream/70 mr-2">
              Berakhir Dalam:
            </span>
            <div className="flex items-center space-x-1.5 font-sans text-xs font-bold">
              {/* Dusty Blue background MUST use Deep Plum text per §4 */}
              <span className="bg-brand-blue text-brand-plum px-3 py-2 rounded-xl animate-pulse-glow min-w-[2.5rem] text-center font-bold">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-brand-gold font-bold">:</span>
              <span className="bg-brand-blue text-brand-plum px-3 py-2 rounded-xl animate-pulse-glow min-w-[2.5rem] text-center font-bold">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-brand-gold font-bold">:</span>
              <span className="bg-brand-blue text-brand-plum px-3 py-2 rounded-xl animate-pulse-glow min-w-[2.5rem] text-center font-bold">
                {formatNumber(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </SectionHeader>

        <div
          className={
            isFullPage
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6'
              : 'flex md:grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 overflow-x-auto pb-4 md:pb-0 scrollbar-hide snap-x'
          }
        >
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              className={isFullPage ? '' : 'w-[45vw] sm:w-[35vw] md:w-auto flex-shrink-0 snap-start'}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {!isFullPage && mappedProducts.length > 4 && (
          <div className="flex justify-center mt-12">
            <Link href="/flash-sale">
              <Button
                variant="accent"
                size="md"
              >
                Lihat Semua Flash Sale
              </Button>
            </Link>
          </div>
        )}
      </PageContainer>
    </section>
  )
}

