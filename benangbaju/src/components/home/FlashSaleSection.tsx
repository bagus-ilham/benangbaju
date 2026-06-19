'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FlashSaleDetail } from '@/services/flashSales'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductListItem } from '@/services/products'
import { Button, PageContainer, SectionHeader } from '@/components/shared'

interface FlashSaleSectionProps {
  flashSale: FlashSaleDetail | null
}

export function FlashSaleSection({ flashSale }: FlashSaleSectionProps) : React.JSX.Element | null {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

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

  const mappedProducts: ProductListItem[] = flashSale.flash_sale_items.map((item) => {
    const pv = item.product_variants
    const prod = pv?.products

    const images = prod?.product_images?.map((img: { url: string; alt_text?: string | null; is_primary?: boolean }, idx: number) => ({
      id: String(idx),
      url: img.url,
      alt_text: img.alt_text || prod.name,
      sort_order: idx,
      is_primary: img.is_primary ?? false,
    })) || []

    return {
      id: prod?.id || '',
      category_id: '',
      name: prod?.name || 'Produk Flash Sale',
      slug: prod?.slug || '',
      description: null,
      short_description: null,
      weight_gram: 1000,
      is_featured: false,
      created_at: new Date().toISOString(),
      categories: null,
      product_variants: [
        {
          id: pv?.id || '',
          sku: pv?.sku || '',
          name: pv?.name || '',
          price: Number(item.sale_price),
          compare_price: Number(item.original_price),
          stock: pv?.stock || 0,
          weight_gram: null,
          is_active: true,
        },
      ],
      product_images: images,
    }
  })

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  return (
    <section className="relative bg-brand-black py-16 md:py-20 border-b border-neutral-800 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" aria-hidden />
      <PageContainer className="relative">
        <SectionHeader
          align="left"
          showDivider={false}
          eyebrow="Penawaran Terbatas"
          title={flashSale.name || 'Flash Sale'}
          className="md:flex-row md:items-end md:justify-between md:mb-8 [&>span:first-child]:text-error [&_h2]:text-white"
        >
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-500 mr-2">
              Berakhir Dalam:
            </span>
            <div className="flex items-center space-x-1.5 font-heading text-xs font-semibold">
              <span className="bg-brand-gold text-brand-black px-3 py-2 rounded-none animate-pulse-glow min-w-[2.5rem] text-center">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-brand-gold-light">:</span>
              <span className="bg-brand-gold text-brand-black px-3 py-2 rounded-none animate-pulse-glow min-w-[2.5rem] text-center">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-brand-gold-light">:</span>
              <span className="bg-brand-gold text-brand-black px-3 py-2 rounded-none animate-pulse-glow min-w-[2.5rem] text-center">
                {formatNumber(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </SectionHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {mappedProducts.slice(0, 4).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link href="/flash-sale">
            <Button variant="secondary" size="md" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-brand-black">
              Lihat Semua Flash Sale
            </Button>
          </Link>
        </div>
      </PageContainer>
    </section>
  )
}
