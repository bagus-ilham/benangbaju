'use client'

import React, { useRef } from 'react'
import { SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { Button } from '@/shared/components/Button'
import { formatIDR, formatMYR } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

import { useProducts } from '@/modules/products/hooks/useProducts'

export function MiniCartDrawer(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'
  const items = useCartStore((state) => state.items)
  const isCartDrawerOpen = useCartStore((state) => state.isCartDrawerOpen)
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const addItem = useCartStore((state) => state.addItem)

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)

  const totalMyr = isMY
    ? items.reduce((acc, item) => acc + (Number(item.priceMyr) || 0) * item.quantity, 0)
    : 0
  const hasUnavailableMYItems =
    isMY && items.some((item) => !item.priceMyr || Number(item.priceMyr) <= 0)

  // Real Database Cross-Sell recommendations
  const { data: recsData } = useProducts({ sortBy: 'featured', limit: 6 })
  const recProducts = (recsData?.data || [])
    .filter((p) => (!isMY ? true : p.isAvailableInMY))
    .filter((p) => !items.some((item) => p.product_variants.some((v) => v.id === item.variantId)))
    .slice(0, 2)

  const drawerRef = useRef<HTMLDivElement>(null)

  const handleQtyChange = async (
    variantId: string,
    currentQty: number,
    change: number,
    stock: number
  ) => {
    const newQty = currentQty + change
    if (newQty <= 0) {
      await removeItem(variantId)
      return
    }
    if (newQty > stock) return
    await updateQuantity(variantId, newQty)
  }

  // Focus trap logic
  useFocusTrap(isCartDrawerOpen, drawerRef, {
    onClose: () => setCartDrawerOpen(false),
  })

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md bg-brand-cream/98 backdrop-blur-md shadow-2xl h-full flex flex-col z-10 border-l border-brand-plum/10 outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang Belanja"
            tabIndex={-1}
          >
            {/* Top pastel accent line */}
            <div
              className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-blush to-brand-gold"
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-plum/10 mt-[3px]">
              <div className="flex items-center space-x-2.5">
                <HandDrawnIcon name="shopping-bag" className="h-4 w-4 text-brand-plum" aria-hidden="true" />
                <span className="font-serif text-lg font-medium tracking-tight text-brand-plum">
                  {market === 'MY' ? `Shopping Bag (${totalQuantity})` : `Keranjang (${totalQuantity})`}
                </span>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="text-neutral-400 hover:text-brand-plum p-1 transition-colors cursor-pointer"
                aria-label="Tutup keranjang"
              >
                <HandDrawnIcon name="close" className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* B2-5: De Minimis Customs Notice for Malaysia */}
            {isMY && totalMyr >= 450 && (
              <div className="mx-6 mt-3 p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-snug flex items-start gap-2">
                <span className="text-sm shrink-0">ℹ️</span>
                <div>
                  <span className="font-semibold">Malaysian Customs Notice (De Minimis):</span>{' '}
                  {totalMyr >= 500
                    ? 'Orders exceeding RM 500 may be subject to SST / import duty upon arrival according to Malaysian Royal Customs regulations.'
                    : 'Your order is approaching the RM 500 De Minimis duty-free threshold. Shipments above RM 500 may incur local customs duties.'}
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div
                    className="relative p-4 bg-brand-blush/50 border border-brand-blush-stroke/60 rounded-2xl animate-gentle-float flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <HandDrawnIcon name="shopping-bag" className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-serif font-medium tracking-tight text-brand-plum">
                      {market === 'MY' ? 'Your Bag is Empty' : 'Keranjang Anda Kosong'}
                    </p>
                    <p className="text-xs text-neutral-500 font-sans max-w-[220px]">
                      {market === 'MY' ? 'Add your favorite pieces to proceed to checkout.' : 'Simpan produk impian Anda untuk memproses checkout.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setCartDrawerOpen(false)}
                    variant="outline"
                    size="sm"
                    className="text-[10px] uppercase font-bold tracking-wider mt-2"
                  >
                    {market === 'MY' ? 'Explore Collection' : 'Jelajahi Produk'}
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex space-x-4 py-4 border-b border-neutral-100 last:border-0 items-start"
                  >
                    {/* Item Image */}
                    <div
                      className="relative aspect-[3/4] w-16 bg-brand-rose-soft/65 border border-brand-plum/10 rounded-xl overflow-hidden flex-shrink-0"
                      aria-hidden="true"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={getProxiedImageUrl(item.imageUrl)}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 uppercase font-sans">
                          No Img
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/produk/${item.slug}`}
                          onClick={() => setCartDrawerOpen(false)}
                        >
                          <h4 className="text-sm font-serif font-medium text-brand-plum hover:text-brand-blue transition-colors line-clamp-2 leading-snug">
                            {item.productName || item.name}
                          </h4>
                        </Link>
                        {/* 🎨 PALETTE ENHANCEMENT
                        Problem: Tidak ada konfirmasi sebelum menghapus item dari keranjang (rentan terhapus tidak sengaja).
                        Fix: Ditambahkan window.confirm
                        Impact: Mencegah penghapusan item keranjang yang tidak disengaja */}
                        <button
                          onClick={() => {
                            if (window.confirm(market === 'MY' ? 'Remove this item from your bag?' : 'Hapus item ini dari keranjang?')) {
                              removeItem(item.variantId)
                            }
                          }}
                          className="text-neutral-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                          aria-label="Hapus item"
                        >
                          <HandDrawnIcon name="trash" className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <p className="text-[9px] uppercase tracking-wider font-heading font-medium text-neutral-400">
                        {market === 'MY' ? 'Variant:' : 'Varian:'} {item.variantName || 'Default'}
                      </p>

                      <div className="flex justify-between items-end pt-1">
                        {/* Qty adjustments */}
                        <div className="flex items-center border border-brand-plum/15 rounded-xl overflow-hidden bg-brand-cream scale-95 origin-left">
                          <button
                            onClick={() =>
                              handleQtyChange(
                                item.variantId,
                                item.quantity,
                                -1,
                                isMY ? (item.stockMy ?? 0) : item.stock
                              )
                            }
                            className="p-1.5 text-neutral-500 hover:text-brand-plum transition-colors cursor-pointer"
                            aria-label="Kurangi jumlah"
                          >
                            <HandDrawnIcon name="minus" className="h-2.5 w-2.5" aria-hidden="true" />
                          </button>
                          <span
                            className="px-2 text-[10px] font-sans font-semibold text-brand-plum w-6 text-center select-none"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQtyChange(
                                item.variantId,
                                item.quantity,
                                1,
                                isMY ? (item.stockMy ?? 0) : item.stock
                              )
                            }
                            className="p-1.5 text-neutral-500 hover:text-brand-plum transition-colors cursor-pointer"
                            aria-label="Tambah jumlah"
                          >
                            <HandDrawnIcon name="plus" className="h-2.5 w-2.5" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {isMY ? (
                            item.priceMyr && Number(item.priceMyr) > 0 ? (
                              <div className="flex items-center justify-end space-x-1.5">
                                <span className="text-xs font-sans font-bold text-brand-plum">
                                  {formatMYR(Number(item.priceMyr) * item.quantity)}
                                </span>
                                {item.comparePriceMyr &&
                                  Number(item.comparePriceMyr) > Number(item.priceMyr) && (
                                    <span className="text-[10px] font-sans text-neutral-400 line-through">
                                      {formatMYR(Number(item.comparePriceMyr) * item.quantity)}
                                    </span>
                                  )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-red-600">
                                Unavailable in MY
                              </span>
                            )
                          ) : (
                            <div className="flex items-center justify-end space-x-1.5">
                              <span className="text-xs font-sans font-semibold text-brand-plum">
                                {formatIDR(item.price * item.quantity)}
                              </span>
                              {item.comparePrice && item.comparePrice > item.price && (
                                <span className="text-[10px] font-sans text-neutral-400 line-through">
                                  {formatIDR(item.comparePrice * item.quantity)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Smart Cross-sell Recommendations */}
              {items.length > 0 && recProducts.length > 0 && (
                <div className="pt-4 border-t border-brand-plum/10 space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-brand-plum">
                    <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5" />
                    <span className="text-sm font-accent font-bold text-brand-blue leading-none">
                      {market === 'MY' ? 'Complete Your Look' : 'Lengkapi Penampilan Anda'}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {recProducts.slice(0, 2).map((p) => {
                      const availableVariant = isMY
                        ? p.product_variants.find(
                            (v) => v.is_active && v.price_myr != null && v.price_myr > 0 && (v.stock_my ?? 0) > 0
                          )
                        : p.product_variants.find((v) => v.is_active && v.stock > 0)
                      const primaryImage =
                        p.product_images?.find((img) => img.is_primary)?.url ||
                        p.product_images?.[0]?.url ||
                        null

                      return (
                        <div
                          key={p.id}
                          className="bg-brand-blush/45 p-2.5 rounded-2xl border border-brand-blush-stroke/55 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {primaryImage && (
                              <div className="relative w-10 h-12 rounded-xl overflow-hidden shrink-0 border border-brand-plum/10 bg-brand-rose-soft/65">
                                <Image
                                  src={getProxiedImageUrl(primaryImage)}
                                  alt={p.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-xs font-serif font-medium text-brand-plum truncate">
                                {p.name}
                              </p>
                              <div className="flex flex-col">
                                {isMY && p.minPriceMyr != null ? (
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] font-sans font-bold text-brand-plum">
                                      {formatMYR(p.minPriceMyr)}
                                    </span>
                                    {p.comparePriceMyr && p.comparePriceMyr > p.minPriceMyr && (
                                      <span className="text-[9px] font-sans text-neutral-400 line-through">
                                        {formatMYR(p.comparePriceMyr)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] font-sans font-bold text-brand-plum">
                                      {formatIDR(p.minPrice)}
                                    </span>
                                    {p.comparePrice && p.comparePrice > p.minPrice && (
                                      <span className="text-[9px] font-sans text-neutral-400 line-through">
                                        {formatIDR(p.comparePrice)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={!availableVariant}
                            onClick={async () => {
                              if (availableVariant) {
                                await addItem(
                                  {
                                    variantId: availableVariant.id,
                                    productName: p.name,
                                    variantName: availableVariant.name,
                                    name: p.name,
                                    sku: availableVariant.sku,
                                    price: Number(availableVariant.price),
                                    comparePrice: availableVariant.compare_price
                                      ? Number(availableVariant.compare_price)
                                      : null,
                                    priceMyr:
                                      availableVariant.price_myr != null
                                        ? Number(availableVariant.price_myr)
                                        : null,
                                    comparePriceMyr:
                                      availableVariant.compare_price_myr != null
                                        ? Number(availableVariant.compare_price_myr)
                                        : null,
                                    imageUrl: primaryImage,
                                    slug: p.slug,
                                    stock: availableVariant.stock,
                                    stockMy: availableVariant.stock_my ?? 0,
                                  },
                                  1
                                )
                              }
                            }}
                            className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg shrink-0"
                          >
                            {market === 'MY' ? '+ Add' : '+ Tambah'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Panel */}
            {items.length > 0 && (
              <div className="p-6 border-t border-brand-plum/10 bg-brand-gold-soft/35 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-heading font-semibold uppercase tracking-wider text-neutral-500">
                    Subtotal
                  </span>
                  <div className="text-right">
                    {isMY ? (
                      <span className="text-base font-sans font-bold text-brand-plum">
                        {formatMYR(totalMyr)}
                      </span>
                    ) : (
                      <span className="text-base font-sans font-bold text-brand-plum">
                        {formatIDR(subtotal)}
                      </span>
                    )}
                  </div>
                </div>

                {hasUnavailableMYItems && (
                  <p className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                    Some items in your bag are not available for Malaysia shipping. Please remove them before checkout.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/cart" onClick={() => setCartDrawerOpen(false)} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full text-[10px] uppercase font-bold py-3.5"
                    >
                      {market === 'MY' ? 'View Bag' : 'Lihat Keranjang'}
                    </Button>
                  </Link>
                  <Link
                    href={hasUnavailableMYItems ? '/cart' : '/checkout'}
                    onClick={() => setCartDrawerOpen(false)}
                    className="w-full"
                  >
                    <Button
                      variant="accent"
                      disabled={hasUnavailableMYItems}
                      className="w-full text-[10px] uppercase font-bold py-3.5 flex items-center justify-center space-x-1.5"
                    >
                      <span>Checkout</span>
                      <HandDrawnIcon name="arrow-right" className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>

                <p className="text-[8px] text-center text-neutral-400 leading-normal font-sans">
                  {market === 'MY' ? '* Shipping fees and promo codes will be calculated at checkout.' : '* Biaya pengiriman dan kode diskon akan dihitung di halaman checkout.'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
