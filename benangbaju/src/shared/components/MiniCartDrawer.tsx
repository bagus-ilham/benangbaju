'use client'

import React, { useRef } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { Button } from '@/shared/components/Button'
import { formatIDR } from '@/lib/utils'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'

export function MiniCartDrawer(): React.JSX.Element {
  const items = useCartStore((state) => state.items)
  const isCartDrawerOpen = useCartStore((state) => state.isCartDrawerOpen)
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)

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
            className="relative w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl h-full flex flex-col z-10 border-l border-neutral-100 outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang Belanja"
            tabIndex={-1}
          >
            {/* Top gold accent line */}
            <div
              className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold to-brand-gold-light"
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 mt-[3px]">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4 text-brand-gold" aria-hidden="true" />
                <span className="font-heading text-sm font-bold tracking-[0.15em] text-brand-black uppercase">
                  KERANJANG ({totalQuantity})
                </span>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="text-neutral-400 hover:text-brand-black p-1 transition-colors cursor-pointer"
                aria-label="Tutup keranjang"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div
                    className="relative p-4 bg-brand-cream border border-brand-gold/10 rounded-none animate-gentle-float"
                    aria-hidden="true"
                  >
                    <ShoppingBag className="h-8 w-8 text-brand-gold" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-black">
                      Keranjang Anda Kosong
                    </p>
                    <p className="text-[10px] text-neutral-400 font-sans max-w-[200px]">
                      Simpan produk impian Anda untuk memproses checkout.
                    </p>
                  </div>
                  <Button
                    onClick={() => setCartDrawerOpen(false)}
                    variant="outline"
                    size="sm"
                    className="text-[10px] uppercase font-bold tracking-wider mt-2"
                  >
                    Jelajahi Produk
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
                      className="relative aspect-[3/4] w-16 bg-neutral-100 border border-neutral-100 overflow-hidden flex-shrink-0"
                      aria-hidden="true"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
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
                          <h4 className="text-xs font-heading font-medium uppercase tracking-wider text-brand-black hover:text-brand-gold transition-colors line-clamp-2">
                            {item.productName || item.name}
                          </h4>
                        </Link>
                        {/* 🎨 PALETTE ENHANCEMENT
                        Problem: Tidak ada konfirmasi sebelum menghapus item dari keranjang (rentan terhapus tidak sengaja).
                        Fix: Ditambahkan window.confirm
                        Impact: Mencegah penghapusan item keranjang yang tidak disengaja */}
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus item ini dari keranjang?')) {
                              removeItem(item.variantId)
                            }
                          }}
                          className="text-neutral-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <p className="text-[9px] uppercase tracking-wider font-heading font-medium text-neutral-400">
                        Varian: {item.variantName || 'Default'}
                      </p>

                      <div className="flex justify-between items-end pt-1">
                        {/* Qty adjustments */}
                        <div className="flex items-center border border-neutral-200 bg-white scale-90 origin-left">
                          <button
                            onClick={() =>
                              handleQtyChange(item.variantId, item.quantity, -1, item.stock)
                            }
                            className="p-1.5 text-neutral-500 hover:text-brand-black transition-colors cursor-pointer"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="h-2.5 w-2.5" aria-hidden="true" />
                          </button>
                          <span
                            className="px-2 text-[10px] font-sans font-semibold text-brand-black w-6 text-center select-none"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQtyChange(item.variantId, item.quantity, 1, item.stock)
                            }
                            className="p-1.5 text-neutral-500 hover:text-brand-black transition-colors cursor-pointer"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs font-sans font-semibold text-brand-black">
                          {formatIDR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Panel */}
            {items.length > 0 && (
              <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-heading font-semibold uppercase tracking-wider text-neutral-500">
                    Subtotal
                  </span>
                  <span className="text-base font-sans font-bold text-brand-black">
                    {formatIDR(subtotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/cart" onClick={() => setCartDrawerOpen(false)} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full text-[10px] uppercase font-bold py-3.5"
                    >
                      Lihat Keranjang
                    </Button>
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setCartDrawerOpen(false)}
                    className="w-full"
                  >
                    <Button
                      variant="primary"
                      className="w-full text-[10px] uppercase font-bold py-3.5 flex items-center justify-center space-x-1.5"
                    >
                      <span>Checkout</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>

                <p className="text-[8px] text-center text-neutral-400 leading-normal font-sans">
                  * Biaya pengiriman dan kode diskon akan dihitung di halaman checkout.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
