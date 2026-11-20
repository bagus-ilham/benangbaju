'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { Button, Card, PageContainer, EmptyState, PageHero, HandDrawnIcon } from '@/shared/components'
import { formatIDR, formatMYR } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import toast from 'react-hot-toast'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

export default function CartPage(): React.JSX.Element {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const market = useMarket()
  const isMY = market === 'MY'

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)

  const originalSubtotal = items.reduce((acc, item) => {
    const basePrice = item.comparePrice || item.price
    return acc + basePrice * item.quantity
  }, 0)
  const totalDiscount = originalSubtotal - subtotal

  const totalMyr = isMY
    ? items.reduce((acc, item) => acc + (Number(item.priceMyr) || 0) * item.quantity, 0)
    : 0
  const originalMyr = isMY
    ? items.reduce((acc, item) => {
        const baseMyr = Number(item.comparePriceMyr || item.priceMyr) || 0
        return acc + baseMyr * item.quantity
      }, 0)
    : 0
  const totalDiscountMyr = Math.max(0, originalMyr - totalMyr)
  const hasUnavailableMYItems =
    isMY && items.some((item) => !item.priceMyr || Number(item.priceMyr) <= 0)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="bg-brand-cream min-h-screen">
        <PageHero
          eyebrow={market === 'MY' ? 'Your Shopping Bag' : 'Pembelian Anda'}
          title={market === 'MY' ? 'Shopping Bag' : 'Keranjang Belanja'}
          subtitle={market === 'MY' ? 'Loading your shopping bag...' : 'Memuat keranjang belanja Anda...'}
        />
        <PageContainer className="py-10 page-content">
          <div className="py-20 text-center text-xs text-neutral-400 uppercase tracking-widest animate-pulse">
            {market === 'MY' ? 'Loading bag...' : 'Memuat keranjang...'}
          </div>
        </PageContainer>
      </div>
    )
  }

  const handleQtyChange = async (
    variantId: string,
    currentQty: number,
    change: number,
    stock: number
  ) => {
    const newQty = currentQty + change
    if (newQty <= 0) {
      await removeItem(variantId)
      toast.success(market === 'MY' ? 'Item removed from bag.' : 'Produk dihapus dari keranjang.')
      return
    }

    if (newQty > stock) {
      toast.error(market === 'MY' ? 'Quantity exceeds available stock.' : 'Jumlah pembelian melebihi stok yang tersedia.')
      return
    }

    await updateQuantity(variantId, newQty)
  }

  const handleRemove = async (variantId: string, name: string) => {
    await removeItem(variantId)
    toast.success(market === 'MY' ? `${name} removed from bag.` : `${name} dihapus dari keranjang.`)
  }

  return (
    <div className="bg-brand-cream min-h-screen">
      <PageHero
        eyebrow={market === 'MY' ? 'Your Shopping Bag' : 'Pembelian Anda'}
        title={market === 'MY' ? 'Shopping Bag' : 'Keranjang Belanja'}
        subtitle={
          market === 'MY' ? (items.length > 0 ? `${totalQuantity} items in bag` : 'Your shopping bag') : (items.length > 0 ? `${totalQuantity} item dalam keranjang` : 'Keranjang belanja Anda')
        }
      />
      <PageContainer className="pt-10 pb-20 md:pb-24 page-content">
        {items.length === 0 ? (
          <EmptyState
            title={market === 'MY' ? 'Your Bag is Empty' : 'Keranjang Anda Kosong'}
            description={market === 'MY' ? 'You have not added any pieces to your shopping bag yet.' : 'Anda belum menambahkan produk apapun ke dalam keranjang belanja.'}
            action={{ label: market === 'MY' ? 'Explore Collection' : 'Jelajahi Produk', href: '/produk' }}
          />
        ) : (
          // Cart Grid Layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-0">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 bg-brand-cream border border-brand-plum/10 rounded-2xl shadow-xs gap-4 mb-4"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {item.imageUrl && (
                          <div className="relative w-16 h-20 md:w-20 md:h-24 border border-brand-plum/10 rounded-xl overflow-hidden shrink-0 bg-brand-rose-soft/65">
                            <Image
                              src={getProxiedImageUrl(item.imageUrl)}
                              alt={item.productName || item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <Link href={`/produk/${item.slug}`} className="block group">
                            <div className="text-[15px] font-serif font-medium text-brand-plum group-hover:text-brand-blue truncate transition-colors">
                              {item.productName || item.name}
                            </div>
                          </Link>
                          {item.variantName && (
                            <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-sans font-semibold">
                              {market === 'MY' ? 'Variant:' : 'Varian:'} {item.variantName}
                            </p>
                          )}
                          {item.sku && (
                            <p className="text-[9px] text-neutral-600 font-sans">SKU: {item.sku}</p>
                          )}
                          <div className="flex flex-col pt-1">
                            {isMY ? (
                              item.priceMyr && Number(item.priceMyr) > 0 ? (
                                <div className="flex items-baseline space-x-2">
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
                                <span className="text-[11px] font-bold text-red-600">
                                  Not available for Malaysia delivery (please remove)
                                </span>
                              )
                            ) : (
                              <div className="flex items-baseline space-x-2">
                                <span className="text-xs font-sans font-bold text-brand-plum">
                                  {formatIDR(item.price * item.quantity)}
                                </span>
                                {item.comparePrice && item.comparePrice > item.price && (
                                  <span className="text-[10px] font-sans text-neutral-600 line-through">
                                    {formatIDR(item.comparePrice * item.quantity)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Actions */}
                      <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                        <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(
                                item.variantId,
                                item.quantity,
                                -1,
                                isMY ? (item.stockMy ?? 0) : item.stock
                              )
                            }
                            className="p-2 text-neutral-600 hover:text-brand-plum hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label={market === 'MY' ? 'Reduce quantity' : 'Kurangi jumlah'}
                          >
                            <HandDrawnIcon name="minus" className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-sans font-bold text-brand-plum min-w-[28px] text-center select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(
                                item.variantId,
                                item.quantity,
                                1,
                                isMY ? (item.stockMy ?? 0) : item.stock
                              )
                            }
                            className="p-2 text-neutral-600 hover:text-brand-plum hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label={market === 'MY' ? 'Increase quantity' : 'Tambah jumlah'}
                          >
                            <HandDrawnIcon name="plus" className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            onClick={() => handleRemove(item.variantId, item.productName || item.name)}
                            className="p-2 text-neutral-400 hover:text-red-600 transition-colors flex items-center space-x-1 text-xs font-sans cursor-pointer"
                            aria-label={market === 'MY' ? 'Delete item' : 'Hapus produk'}
                          >
                            <HandDrawnIcon name="trash" className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-[10px]">{market === 'MY' ? 'Remove' : 'Hapus'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Checkout Summary Sidebar (4 cols) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-4 lg:sticky lg:top-24"
            >
              <Card
                bordered={true}
                className="bg-brand-cream border-brand-plum/10 p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden rounded-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-brand-blush to-brand-blue" />
                <h2 className="text-lg font-serif font-medium tracking-tight text-brand-plum border-b border-brand-plum/10 pb-4">
                  {market === 'MY' ? 'Order Summary' : 'Ringkasan Belanja'}
                </h2>

                <div className="space-y-3 text-xs font-sans text-neutral-600">
                  <div className="flex justify-between">
                    <span>{market === 'MY' ? 'Total Items' : 'Jumlah Barang'}</span>
                    <span className="text-brand-plum font-semibold">{totalQuantity} pcs</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span>{market === 'MY' ? 'Base Price' : 'Total Harga (Base)'}</span>
                    <div className="text-right">
                      <span>
                        {isMY ? formatMYR(originalMyr) : formatIDR(originalSubtotal)}
                      </span>
                    </div>
                  </div>
                  {(isMY ? totalDiscountMyr > 0 : totalDiscount > 0) && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>{market === 'MY' ? 'Total Discount' : 'Total Diskon Produk'}</span>
                      <span>
                        -{isMY ? formatMYR(totalDiscountMyr) : formatIDR(totalDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-neutral-400 italic pt-1">
                    <span>
                      {market === 'MY'
                        ? '* Shipping fees (in RM) calculated at checkout.'
                        : '* Ongkos kirim dihitung saat checkout'}
                    </span>
                  </div>

                  <div className="flex flex-col border-t border-neutral-200 pt-4">
                    <div className="flex justify-between text-sm font-sans font-bold text-brand-plum">
                      <span>Subtotal</span>
                      <span className="text-base font-bold">
                        {isMY ? formatMYR(totalMyr) : formatIDR(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {hasUnavailableMYItems && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
                    Some items in your bag are not available for Malaysia shipping. Please remove them before proceeding to checkout.
                  </div>
                )}

                {isMY && totalMyr >= 450 && (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-snug flex items-start gap-2">
                    <span className="text-base shrink-0">ℹ️</span>
                    <div>
                      <span className="font-semibold">Malaysian Customs Notice:</span>{' '}
                      {totalMyr >= 500
                        ? 'Orders exceeding RM 500 may be subject to SST / import duty upon arrival according to Malaysian Royal Customs regulations.'
                        : 'Your order is approaching the RM 500 De Minimis duty-free threshold. Shipments above RM 500 may incur local customs duties.'}
                    </div>
                  </div>
                )}

                <Link href={hasUnavailableMYItems ? '/cart' : '/checkout'} className="block w-full pt-2">
                  <Button
                    variant="accent"
                    size="lg"
                    disabled={hasUnavailableMYItems}
                    className="w-full flex items-center justify-center space-x-2 font-bold"
                  >
                    <span>{market === 'MY' ? 'Proceed to Checkout' : 'Lanjut Ke Checkout'}</span>
                    <HandDrawnIcon name="arrow-right" className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                <div className="bg-brand-blue-soft/50 border border-brand-blue-stroke/55 border-l-2 border-l-brand-blue p-4 rounded-xl text-[10px] text-brand-plum/80 leading-relaxed font-sans">
                  {market === 'MY'
                    ? 'Complete your order securely. We support Cross-Border DuitNow / Touch \'n Go QR via DOKU.'
                    : 'Selesaikan pemesanan Anda dengan aman. Kami mendukung pembayaran Transfer Bank otomatis, QRIS, e-Wallet via DOKU.'}
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
