'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatProductDescription, cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
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
  const market = useMarket()
  const [selectedUnit, setSelectedUnit] = useState<'CM' | 'INCH' | null>(null)
  const unit = selectedUnit ?? (market === 'MY' ? 'INCH' : 'CM')

  return (
    <motion.div variants={itemVariants} className="space-y-2 pt-2">
      <div className="flex bg-neutral-100/80 p-1.5 rounded-2xl w-full border border-neutral-200/60 font-sans text-[10px] font-bold uppercase tracking-widest relative mb-2 shadow-inner">
        <button
          onClick={() => setActiveTab('details')}
          className={cn(
            'flex-1 py-2 text-center transition-colors relative z-10 rounded-xl cursor-pointer',
            activeTab === 'details' ? 'text-brand-plum font-bold' : 'text-neutral-600 hover:text-brand-plum'
          )}
        >
          {market === 'MY' ? 'Details' : 'Detail'}
          {activeTab === 'details' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute inset-0 bg-brand-gold/60 shadow-xs rounded-xl -z-10 border border-amber-200/60"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={cn(
            'flex-1 py-2 text-center transition-colors relative z-10 rounded-xl cursor-pointer',
            activeTab === 'shipping'
              ? 'text-brand-plum font-bold'
              : 'text-neutral-600 hover:text-brand-plum'
          )}
        >
          {market === 'MY' ? 'Size Guide' : 'Panduan'}
          {activeTab === 'shipping' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute inset-0 bg-brand-gold/60 shadow-xs rounded-xl -z-10 border border-amber-200/60"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('care')}
          className={cn(
            'flex-1 py-2 text-center transition-colors relative z-10 rounded-xl cursor-pointer',
            activeTab === 'care' ? 'text-brand-plum font-bold' : 'text-neutral-600 hover:text-brand-plum'
          )}
        >
          {market === 'MY' ? 'Care Guide' : 'Perawatan'}
          {activeTab === 'care' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute inset-0 bg-brand-cream shadow-xs rounded-xl -z-10 border border-neutral-200/60"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      </div>

      <div className="pt-2 text-xs text-neutral-600 font-sans leading-relaxed min-h-[80px]">
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
                  <p className="text-[10px] text-neutral-600 font-sans">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-3">
                {/* Unit Switcher if any size guide exists */}
                {(product.size_guide || product.size_guide_inch) && (
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">
                      {unit === 'INCH' ? 'Size Guide (Inches)' : 'Panduan Ukuran (CM)'}
                    </span>
                    <div className="flex items-center bg-neutral-200/80 p-0.5 rounded-full border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => setSelectedUnit('CM')}
                        className={cn(
                          'px-2 py-0.5 text-[9px] font-bold rounded-full transition-all cursor-pointer',
                          unit === 'CM'
                            ? 'bg-brand-plum text-white shadow-xs'
                            : 'text-neutral-600 hover:text-brand-plum'
                        )}
                      >
                        CM
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUnit('INCH')}
                        className={cn(
                          'px-2 py-0.5 text-[9px] font-bold rounded-full transition-all cursor-pointer',
                          unit === 'INCH'
                            ? 'bg-brand-plum text-white shadow-xs'
                            : 'text-neutral-600 hover:text-brand-plum'
                        )}
                      >
                        INCH (&quot;)
                      </button>
                    </div>
                  </div>
                )}

                {(() => {
                  const hasInch = Boolean(product.size_guide_inch && product.size_guide_inch.trim())
                  const hasCm = Boolean(product.size_guide && product.size_guide.trim())
                  const guideToShow =
                    unit === 'INCH' && hasInch ? product.size_guide_inch : product.size_guide

                  if (guideToShow) {
                    return (
                      <div className="space-y-2">
                        {unit === 'INCH' && !hasInch && hasCm && (
                          <p className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-xl">
                            Catatan: Panduan ukuran dalam CM. Konversi: <strong>1 inch = 2.54 cm</strong>.
                          </p>
                        )}
                        {guideToShow.trim().startsWith('http') ? (
                          <div className="w-full flex justify-start my-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={guideToShow.trim()}
                              alt={`Panduan Ukuran (${unit})`}
                              className="max-w-full h-auto object-contain border border-neutral-100 bg-neutral-50 rounded-xl"
                            />
                          </div>
                        ) : (
                          <div className="whitespace-pre-line">
                            {formatProductDescription(guideToShow)}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-1 whitespace-pre-line">
                      {market === 'MY' ? (
                        <>
                          <p>
                            <strong>Shipping:</strong> Dispatched from Bandung atelier in 1-2 business days. Estimated arrival 3-7 days via Ninja Van / Lion Parcel.
                          </p>
                          <p>
                            <strong>Sizing:</strong> Please confirm your body measurements before purchasing.
                          </p>
                        </>
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
                  )
                })()}
              </div>
            )}
            {activeTab === 'care' && (
              <div className="space-y-1 whitespace-pre-line">
                {product.care_guide ? (
                  product.care_guide.replace(/<br\s*\/?>/gi, '\n')
                ) : market === 'MY' ? (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Machine wash cold with similar colors</li>
                    <li>Do not bleach</li>
                    <li>Warm iron if necessary</li>
                  </ul>
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
