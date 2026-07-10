'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { Button, Card, PageContainer, EmptyState, PageHero } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage(): React.JSX.Element {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)

  const originalSubtotal = items.reduce((acc, item) => {
    const basePrice = item.comparePrice || item.price
    return acc + basePrice * item.quantity
  }, 0)
  const totalDiscount = originalSubtotal - subtotal

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero
          eyebrow="Pembelian Anda"
          title="Keranjang Belanja"
          subtitle="Memuat keranjang belanja Anda..."
        />
        <PageContainer className="py-10 page-content">
          <div className="py-20 text-center text-xs text-neutral-400 uppercase tracking-widest animate-pulse">
            Memuat keranjang...
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
      toast.success('Produk dihapus dari keranjang.')
      return
    }

    if (newQty > stock) {
      toast.error('Jumlah pembelian melebihi stok yang tersedia.')
      return
    }

    await updateQuantity(variantId, newQty)
  }

  const handleRemove = async (variantId: string, name: string) => {
    await removeItem(variantId)
    toast.success(`${name} dihapus dari keranjang.`)
  }

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow="Pembelian Anda"
        title="Keranjang Belanja"
        subtitle={
          items.length > 0 ? `${totalQuantity} item dalam keranjang` : 'Keranjang belanja Anda'
        }
      />
      <PageContainer className="py-10 page-content">
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Keranjang Anda Kosong"
            description="Anda belum menambahkan produk apapun ke dalam keranjang belanja."
            action={{ label: 'Jelajahi Produk', href: '/produk' }}
          />
        ) : (
          // Cart Grid Layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-0">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, height: 0, y: 15 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -15, transition: { duration: 0.2 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="flex py-6 border-b border-neutral-100 last:border-0 space-x-4 md:space-x-6 items-start overflow-hidden"
                    >
                      {/* Item Image */}
                      <div className="relative aspect-[3/4] w-20 md:w-24 bg-neutral-100 flex-shrink-0 overflow-hidden border border-neutral-100">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="100px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 uppercase font-sans">
                            No Img
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-6">
                        <div className="space-y-1">
                          <Link href={`/produk/${item.slug}`}>
                            <h3 className="text-xs md:text-sm font-heading font-medium uppercase tracking-wide text-brand-black hover:text-brand-gray transition-colors">
                              {item.productName || item.name}
                            </h3>
                          </Link>
                          <p className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-400">
                            Varian: {item.variantName || 'Default'}
                          </p>
                          <p className="text-[9px] text-neutral-400 font-sans">SKU: {item.sku}</p>

                          {/* Remove Action */}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handleRemove(item.variantId, item.productName || item.name)
                            }
                            className="flex items-center text-[10px] text-red-500 hover:text-red-700 space-x-1 pt-2 font-sans"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus</span>
                          </motion.button>
                        </div>

                        {/* Pricing and Quantities */}
                        <div className="flex flex-row md:flex-col md:items-end justify-between items-center space-y-0 md:space-y-3">
                          {/* Price tags */}
                          <div className="flex flex-col md:items-end space-y-0.5">
                            <span className="text-xs md:text-sm font-sans font-semibold text-brand-black">
                              {formatIDR(item.price * item.quantity)}
                            </span>
                            {item.comparePrice && item.comparePrice > item.price && (
                              <span className="text-[10px] font-sans text-neutral-400 line-through">
                                {formatIDR(item.comparePrice * item.quantity)}
                              </span>
                            )}
                          </div>

                          {/* Qty adjustments */}
                          <div className="flex items-center border border-neutral-200 bg-white gold-border-hover">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleQtyChange(item.variantId, item.quantity, -1, item.stock)
                              }
                              className="p-2 text-neutral-500 hover:text-brand-black transition-colors"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </motion.button>
                            <span className="px-3 text-[11px] font-sans font-semibold text-brand-black w-6 text-center select-none">
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleQtyChange(item.variantId, item.quantity, 1, item.stock)
                              }
                              className="p-2 text-neutral-500 hover:text-brand-black transition-colors"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </motion.button>
                          </div>
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
                className="bg-neutral-50 border-neutral-200 p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
                <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-black border-b border-neutral-200 pb-4">
                  Ringkasan Belanja
                </h3>

                <div className="space-y-3 text-xs font-sans text-neutral-600">
                  <div className="flex justify-between">
                    <span>Jumlah Barang</span>
                    <span className="text-brand-black font-semibold">{totalQuantity} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Harga (Base)</span>
                    <span>{formatIDR(originalSubtotal)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total Diskon Produk</span>
                      <span>-{formatIDR(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-neutral-400 italic pt-1">
                    <span>* Ongkos kirim dihitung saat checkout</span>
                  </div>

                  <div className="flex justify-between border-t border-neutral-200 pt-4 text-sm font-sans font-bold text-brand-black">
                    <span>Subtotal</span>
                    <span className="text-base font-semibold">{formatIDR(subtotal)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="block w-full pt-2">
                  <Button
                    variant="primary"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <span>Lanjut Ke Checkout</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                <div className="bg-neutral-50/50 border border-neutral-200 border-l-2 border-l-brand-gold p-4 rounded-none text-[10px] text-neutral-400 leading-relaxed font-sans">
                  Selesaikan pemesanan Anda dengan aman. Kami mendukung pembayaran Transfer Bank
                  otomatis, QRIS, GoPay, dan ShopeePay via Midtrans.
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
