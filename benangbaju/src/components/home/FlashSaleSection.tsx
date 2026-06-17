'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FlashSaleDetail } from '@/services/flashSales'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductListItem } from '@/services/products'

interface FlashSaleSectionProps {
  flashSale: FlashSaleDetail | null
}

export function FlashSaleSection({ flashSale }: FlashSaleSectionProps) {
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

  // Map flash sale items into standard ProductListItem format so we can render them with ProductCard!
  const mappedProducts: ProductListItem[] = flashSale.flash_sale_items.map((item) => {
    const pv = item.product_variants
    const prod = pv?.products
    
    // Map product images
    const images = prod?.product_images?.map((img: any, idx: number) => ({
      id: String(idx),
      url: img.url,
      alt_text: img.alt_text || prod.name,
      sort_order: idx,
      is_primary: img.is_primary,
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
    <section className="bg-neutral-50 py-16 border-b border-neutral-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-red-500">
              Penawaran Terbatas
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
              {flashSale.name || 'Flash Sale'}
            </h2>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-400 mr-2">
              Berakhir Dalam:
            </span>
            <div className="flex items-center space-x-1 font-heading text-xs font-semibold">
              <span className="bg-brand-black text-white px-2.5 py-1.5 rounded-none">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-brand-black">:</span>
              <span className="bg-brand-black text-white px-2.5 py-1.5 rounded-none">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-brand-black">:</span>
              <span className="bg-brand-black text-white px-2.5 py-1.5 rounded-none">
                {formatNumber(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {mappedProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
