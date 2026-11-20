'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components'
import { SOCIAL_LINKS } from '@/lib/constants'
import { Button } from '@/shared/components'
import { VariantPicker } from '@/modules/products/components'
import { formatIDR, formatMYR, cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import type { ProductDetailItem, ProductVariant } from '@/modules/products/types'

interface ProductInfoSectionProps {
  product: ProductDetailItem
  selectedVariant: ProductVariant | null
  minPrice: number
  maxPrice: number
  quantity: number
  liked: boolean
  isAdding: boolean
  isBuying: boolean
  onSizeGuideOpen: () => void
  onVariantSelect: (variant: ProductVariant | null) => void
  onIncrement: () => void
  onDecrement: () => void
  onToggleWishlist: () => void
  onAddToCart: () => void
  onBuyNow: () => void
  thumbnailsNode?: React.ReactNode
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

export function ProductInfoSection({
  product,
  selectedVariant,
  minPrice,
  maxPrice,
  quantity,
  liked,
  isAdding,
  isBuying,
  onSizeGuideOpen,
  onVariantSelect,
  onIncrement,
  onDecrement,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  thumbnailsNode,
}: ProductInfoSectionProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const myPrices = product.product_variants
    .map((v) => (v.price_myr != null && Number(v.price_myr) > 0 ? Number(v.price_myr) : null))
    .filter((p): p is number => p !== null)
  const minPriceMyr = myPrices.length > 0 ? Math.min(...myPrices) : null
  const maxPriceMyr = myPrices.length > 0 ? Math.max(...myPrices) : null
  const activeStock = selectedVariant
    ? isMY
      ? (selectedVariant.stock_my ?? 0)
      : selectedVariant.stock
    : 0
  const isVariantUnavailableInMY =
    isMY && (!selectedVariant?.price_myr || Number(selectedVariant.price_myr) <= 0)
  const canPurchase = Boolean(selectedVariant) && activeStock > 0 && !isVariantUnavailableInMY

  const handleStockNotification = async () => {
    if (!selectedVariant) return
    try {
      const { toggleStockNotificationAction } = await import('@/modules/products/actions')
      const res = await toggleStockNotificationAction(selectedVariant.id, market)
      if (res.isSubscribed) {
        const { default: toast } = await import('react-hot-toast')
        toast.success(market === 'MY' ? 'We will notify you when this item is back in stock!' : 'Kami akan mengabari Anda jika stok produk ini telah tersedia kembali!')
      } else {
        const { default: toast } = await import('react-hot-toast')
        toast.success(market === 'MY' ? 'Restock notification cancelled.' : 'Langganan notifikasi restock dibatalkan.')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const { default: toast } = await import('react-hot-toast')
      if (err.name === 'UnauthorizedError') {
        toast.error(market === 'MY' ? 'Please sign in first to enable restock notification.' : 'Silakan masuk (login) terlebih dahulu untuk mengaktifkan notifikasi restock.')
      } else {
        toast.error(market === 'MY' ? 'Failed to enable restock notification.' : 'Gagal mengaktifkan notifikasi restock.')
      }
    }
  }

  const handleWhatsAppCS = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
    const text = market === 'MY'
      ? `Hello Benangbaju CS, I would like to ask about this item (${product.name}):\n${currentUrl}`
      : `Halo Admin Benangbaju, saya mau bertanya mengenai produk ${product.name}:\n${currentUrl}`
    const waBase = SOCIAL_LINKS.whatsapp || 'https://wa.me/6285179747449'
    const waUrl = `${waBase.includes('wa.me') ? waBase : `https://wa.me/${waBase}`}?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  return (
    <>
      {/* Title, Category & Price */}
      <motion.div variants={itemVariants} className="space-y-2 font-sans">
        {product.categories && (
          <span className="inline-block text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-brand-plum/70">
            {product.categories.name}
          </span>
        )}
        <h1 className="text-2xl lg:text-4xl font-serif font-medium tracking-tight text-brand-plum leading-tight">
          {product.name}
        </h1>

        {/* Price display */}
        <div className="flex flex-col pt-2">
          {isMY ? (
            minPriceMyr != null ? (
              <div className="flex items-baseline space-x-3">
                <span className="text-lg lg:text-xl font-sans font-bold text-brand-plum">
                  {selectedVariant && selectedVariant.price_myr != null
                    ? formatMYR(Number(selectedVariant.price_myr))
                    : maxPriceMyr != null && minPriceMyr !== maxPriceMyr
                      ? `${formatMYR(minPriceMyr)} - ${formatMYR(maxPriceMyr)}`
                      : formatMYR(minPriceMyr)}
                </span>

                {/* Compare Price & Sale Badge in MYR */}
                {selectedVariant ? (
                  selectedVariant.compare_price_myr &&
                  selectedVariant.price_myr &&
                  Number(selectedVariant.compare_price_myr) > Number(selectedVariant.price_myr) && (
                    <>
                      <span className="text-xs text-neutral-500 line-through font-sans">
                        {formatMYR(Number(selectedVariant.compare_price_myr))}
                      </span>
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                        -{Math.round(((Number(selectedVariant.compare_price_myr) - Number(selectedVariant.price_myr)) / Number(selectedVariant.compare_price_myr)) * 100)}%
                      </span>
                    </>
                  )
                ) : (
                  product.product_variants[0]?.compare_price_myr &&
                  Number(product.product_variants[0].compare_price_myr) > minPriceMyr && (
                    <>
                      <span className="text-xs text-neutral-500 line-through font-sans">
                        {formatMYR(Number(product.product_variants[0].compare_price_myr))}
                      </span>
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                        -{Math.round(((Number(product.product_variants[0].compare_price_myr) - minPriceMyr) / Number(product.product_variants[0].compare_price_myr)) * 100)}%
                      </span>
                    </>
                  )
                )}
              </div>
            ) : (
              <span className="text-sm font-sans font-semibold text-brand-plum/85">
                Not available for Malaysia
              </span>
            )
          ) : (
            <div className="flex items-baseline space-x-3">
              <span className="text-lg lg:text-xl font-sans font-bold text-brand-plum">
                {selectedVariant
                  ? formatIDR(selectedVariant.price)
                  : minPrice === maxPrice
                    ? formatIDR(minPrice)
                    : `${formatIDR(minPrice)} - ${formatIDR(maxPrice)}`}
              </span>

              {/* Compare Price & Sale Badge */}
              {selectedVariant ? (
                selectedVariant.compare_price &&
                Number(selectedVariant.compare_price) > Number(selectedVariant.price) && (
                  <>
                    <span className="text-xs text-neutral-600 line-through font-sans">
                      {formatIDR(selectedVariant.compare_price)}
                    </span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                      -{Math.round(((Number(selectedVariant.compare_price) - Number(selectedVariant.price)) / Number(selectedVariant.compare_price)) * 100)}%
                    </span>
                  </>
                )
              ) : (
                product.product_variants[0]?.compare_price &&
                Number(product.product_variants[0].compare_price) > minPrice && (
                  <>
                    <span className="text-xs text-neutral-600 line-through font-sans">
                      {formatIDR(product.product_variants[0].compare_price)}
                    </span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                      -{Math.round(((Number(product.product_variants[0].compare_price) - minPrice) / Number(product.product_variants[0].compare_price)) * 100)}%
                    </span>
                  </>
                )
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Description intro */}
      {(() => {
        const displayShortDesc = isMY
          ? product.short_description_en || product.short_description
          : product.short_description
        if (!displayShortDesc) return null
        return (
          <motion.p
            variants={itemVariants}
            className="text-xs text-neutral-600 font-sans leading-relaxed whitespace-pre-line"
          >
            {displayShortDesc}
          </motion.p>
        )
      })()}

      {/* Thumbnails */}
      {thumbnailsNode && (
        <motion.div variants={itemVariants} className="hidden md:block">
          {thumbnailsNode}
        </motion.div>
      )}

      {/* Varian Picker */}
      <motion.div variants={itemVariants} className="relative">
        {product.product_variants.some((v) =>
          v.product_variant_attrs?.some((a) => a.attr_name.toLowerCase().includes('ukuran'))
        ) && (
            <div className="flex justify-end absolute top-1 right-0 z-10">
              <button
                type="button"
                onClick={onSizeGuideOpen}
                className="text-[9px] uppercase tracking-wider font-heading font-semibold text-neutral-600 hover:text-brand-plum transition-colors underline underline-offset-2 cursor-pointer"
              >
                {market === 'MY' ? 'Size Guide' : 'Panduan Ukuran'}
              </button>
            </div>
          )}
        <VariantPicker
          variants={product.product_variants}
          selectedVariantId={selectedVariant?.id || null}
          onVariantSelect={onVariantSelect}
        />
      </motion.div>

      {/* Varian Stock indicator */}
      {selectedVariant && (
        <motion.div variants={itemVariants} className="text-[11px] text-neutral-600 font-sans">
          {activeStock > 0 ? (
            <span>
              {market === 'MY' ? 'Stock Available: ' : 'Stok Tersedia: '}
              <strong className="text-brand-plum">{activeStock} pcs</strong>
            </span>
          ) : (
            <span className="text-red-500 font-semibold">{market === 'MY' ? 'Out of Stock' : 'Stok Habis'}</span>
          )}
        </motion.div>
      )}

      {/* Actions: Quantity & Add to Cart & Wishlist */}
      <motion.div variants={itemVariants} className="space-y-3 pt-2">
        <div className="flex items-center space-x-3">
          {/* Quantity adjustments */}
          <div className="flex items-center border border-neutral-200 bg-brand-cream rounded-xl overflow-hidden shadow-sm hover:border-neutral-300 transition-colors">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDecrement}
              className="p-3 text-neutral-600 hover:text-brand-plum transition-colors cursor-pointer"
              disabled={!canPurchase}
            >
              <HandDrawnIcon name="minus" className="h-3 w-3" />
            </motion.button>
            <span className="px-4 text-xs font-sans font-semibold text-brand-plum w-8 text-center select-none">
              {quantity}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onIncrement}
              className="p-3 text-neutral-600 hover:text-brand-plum transition-colors cursor-pointer"
              disabled={!canPurchase}
            >
              <HandDrawnIcon name="plus" className="h-3 w-3" />
            </motion.button>
          </div>

          {/* Wishlist Heart button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onToggleWishlist}
            className="p-4 border border-neutral-200 hover:border-brand-blue-stroke bg-brand-cream transition-all text-neutral-600 hover:text-brand-blue-text relative rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-md"
            aria-label={liked ? (market === 'MY' ? 'Remove from wishlist' : 'Hapus dari wishlist') : (market === 'MY' ? 'Add to wishlist' : 'Tambah ke wishlist')}
          >
            <HandDrawnIcon
              name={liked ? 'heart-filled' : 'heart'}
              className={cn(
                'h-4 w-4 transition-all duration-300',
                liked ? 'scale-110' : 'opacity-70 hover:opacity-100'
              )}
            />
          </motion.button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Add to Cart Button */}
          <Button
            onClick={onAddToCart}
            variant="outline"
            className="flex-1"
            isLoading={isAdding}
            disabled={!canPurchase}
          >
            {!selectedVariant
              ? (market === 'MY' ? 'Choose Variant' : 'Pilih Varian')
              : isVariantUnavailableInMY
                ? 'Unavailable in Malaysia'
                : activeStock <= 0
                  ? (market === 'MY' ? 'Out of Stock' : 'Stok Habis')
                  : (market === 'MY' ? 'Add to Bag' : 'Tambah Ke Keranjang')}
          </Button>

          {/* Buy Now Button */}
          <Button
            onClick={onBuyNow}
            variant="accent"
            className="flex-1 font-bold"
            isLoading={isBuying}
            disabled={!canPurchase}
          >
            {!selectedVariant
              ? (market === 'MY' ? 'Choose Variant' : 'Pilih Varian')
              : isVariantUnavailableInMY
                ? 'Unavailable in Malaysia'
                : activeStock <= 0
                  ? (market === 'MY' ? 'Out of Stock' : 'Stok Habis')
                  : (market === 'MY' ? 'Buy Now' : 'Beli Sekarang')}
          </Button>
        </div>

        {selectedVariant && activeStock <= 0 && (
          <Button
            onClick={handleStockNotification}
            variant="outline"
            className="w-full text-xs font-semibold uppercase tracking-wider text-neutral-600 border-neutral-300 hover:text-brand-plum hover:border-brand-plum hover:bg-brand-cream/60 py-2.5 transition-all"
          >
            <HandDrawnIcon name="bell" className="h-3.5 w-3.5 mr-1.5" /> {market === 'MY' ? 'Notify Me When Restocked' : 'Kabari Saya Saat Restock'}
          </Button>
        )}

        <Button
          onClick={handleWhatsAppCS}
          variant="ghost"
          className="w-full text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50/80 border border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 py-2.5 transition-all group/wa"
        >
          <HandDrawnIcon name="whatsapp" className="h-3.5 w-3.5 mr-1.5" /> {market === 'MY' ? 'Chat with CS on WhatsApp' : 'Tanya CS via WhatsApp'}
        </Button>
      </motion.div>

      {/* Info Badges (Shipping / Return / Guarantee) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-3 gap-2 border border-brand-plum/10 py-4 px-2 bg-brand-gold/45 rounded-2xl"
      >
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center space-y-1 cursor-default group"
        >
          <HandDrawnIcon name="truck" className="h-4 w-4" />
          <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-brand-plum">
            {market === 'MY' ? 'Direct to MY' : 'Gratis ongkir'}
          </span>
          <span className="text-[8px] text-neutral-600 font-sans">
            {market === 'MY' ? '4-7 Days from Bandung' : 'Tanpa minimum pembelanjaan'}
          </span>
        </motion.div>
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center space-y-1 cursor-default group"
        >
          <HandDrawnIcon name={market === 'MY' ? 'sparkles' : 'refresh'} className="h-4 w-4" />
          <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-brand-plum">
            {market === 'MY' ? 'DuitNow / TNG QR' : '7 Hari Retur'}
          </span>
          <span className="text-[8px] text-neutral-600 font-sans">
            {market === 'MY' ? 'Easy Cross-Border Pay' : 'Bebas tukar ukuran'}
          </span>
        </motion.div>
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center space-y-1 cursor-default group"
        >
          <HandDrawnIcon name="clothes" className="h-4 w-4" />
          <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-brand-plum">
            {market === 'MY' ? '100% Authentic' : 'Kualitas Premium'}
          </span>
          <span className="text-[8px] text-neutral-600 font-sans">
            {market === 'MY' ? 'Curated Bandung Apparel' : 'Bahan terkurasi'}
          </span>
        </motion.div>
      </motion.div>
    </>
  )
}
