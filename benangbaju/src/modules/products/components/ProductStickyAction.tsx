'use client'

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import type { ProductDetailItem, ProductVariant } from '@/modules/products/types'

interface ProductStickyActionProps {
  showStickyBar: boolean
  product: ProductDetailItem
  selectedVariant: ProductVariant | null
  minPrice: number
  isAdding: boolean
  isBuying: boolean
  onAddToCart: () => void
  onBuyNow: () => void
}

export function ProductStickyAction({
  showStickyBar,
  product,
  selectedVariant,
  minPrice,
  isAdding,
  isBuying,
  onAddToCart,
  onBuyNow,
}: ProductStickyActionProps): React.JSX.Element {
  return (
    <AnimatePresence>
      {showStickyBar && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-neutral-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] py-3 px-4 md:py-4 md:px-8"
        >
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            {/* Product Info (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="relative w-8 h-10 bg-neutral-100 border border-neutral-100 flex-shrink-0">
                <Image
                  src={
                    product.product_images.find((img) => img.is_primary)?.url ||
                    product.product_images[0]?.url ||
                    ''
                  }
                  alt={product.name}
                  className="object-cover"
                  fill
                  sizes="32px"
                />
              </div>
              <div>
                <h4 className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-black line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs font-sans font-semibold text-brand-gold mt-0.5">
                  {selectedVariant ? formatIDR(selectedVariant.price) : formatIDR(minPrice)}
                </p>
              </div>
            </div>

            {/* Variant and Action Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              {/* Small variant display or picker dropdown */}
              {product.product_variants.length > 0 && (
                <div className="text-xs font-sans text-neutral-500">
                  {selectedVariant ? (
                    <span>
                      Varian: <strong className="text-brand-black">{selectedVariant.name}</strong>
                    </span>
                  ) : (
                    <span className="italic text-neutral-400">Pilih varian di atas</span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={onAddToCart}
                  variant="outline"
                  size="sm"
                  className="py-2.5 px-4 text-[10px]"
                  isLoading={isAdding}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  Keranjang
                </Button>
                <Button
                  onClick={onBuyNow}
                  variant="primary"
                  size="sm"
                  className="py-2.5 px-4 text-[10px]"
                  isLoading={isBuying}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  Beli
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
