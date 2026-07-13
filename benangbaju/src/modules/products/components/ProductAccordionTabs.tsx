'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatProductDescription, cn } from '@/lib/utils'
import type { ProductDetailItem, ProductVariant } from '@/modules/products/types'

interface ProductAccordionTabsProps {
  product: ProductDetailItem
  selectedVariant: ProductVariant | null
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

export function ProductAccordionTabs({
  product,
  selectedVariant,
}: ProductAccordionTabsProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details')

  return (
    <motion.div variants={itemVariants} className="space-y-2 pt-2">
      <div className="flex border-b border-neutral-200 font-heading text-[10px] font-medium uppercase tracking-widest relative">
        <button
          onClick={() => setActiveTab('details')}
          className={cn(
            'pb-2 pr-4 transition-colors relative z-10',
            activeTab === 'details' ? 'text-brand-black' : 'text-neutral-400'
          )}
        >
          Detail
          {activeTab === 'details' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-4 h-[2px] bg-brand-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={cn(
            'pb-2 px-4 transition-colors relative z-10',
            activeTab === 'shipping' ? 'text-brand-black' : 'text-neutral-400'
          )}
        >
          Panduan
          {activeTab === 'shipping' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('care')}
          className={cn(
            'pb-2 px-4 transition-colors relative z-10',
            activeTab === 'care' ? 'text-brand-black' : 'text-neutral-400'
          )}
        >
          Perawatan
          {activeTab === 'care' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      </div>

      <div className="pt-2 text-xs text-neutral-500 font-sans leading-relaxed min-h-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'details' && (
              <div className="space-y-2">
                <p className="whitespace-pre-line">
                  {formatProductDescription(product.description)}
                </p>
                {selectedVariant && (
                  <p className="text-[10px] text-neutral-400 font-sans">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-1 whitespace-pre-line">
                {product.size_guide ? (
                  product.size_guide.trim().startsWith('http') ? (
                    <div className="w-full flex justify-start my-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.size_guide.trim()}
                        alt="Panduan Ukuran"
                        className="max-w-full h-auto object-contain border border-neutral-100 bg-neutral-50"
                      />
                    </div>
                  ) : (
                    formatProductDescription(product.size_guide)
                  )
                ) : (
                  <>
                    <p>
                      <strong>Pengiriman:</strong> Pesanan dikirimkan dalam 1-2 hari kerja setelah
                      pembayaran dikonfirmasi.
                    </p>
                    <p>
                      <strong>Ukuran:</strong> Pastikan mengukur detail ukuran badan sebelum
                      membeli.
                    </p>
                  </>
                )}
              </div>
            )}
            {activeTab === 'care' && (
              <div className="space-y-1 whitespace-pre-line">
                {product.care_guide ? (
                  product.care_guide.replace(/<br\s*\/?>/gi, '\n')
                ) : (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Cuci dengan suhu dingin menggunakan warna senada</li>
                    <li>Hindari pemutih pakaian</li>
                    <li>Setrika dengan suhu rendah jika diperlukan</li>
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
