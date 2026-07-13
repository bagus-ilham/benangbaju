'use client'

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, ShoppingBag } from 'lucide-react'
import { Button } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import type { CartItem } from '@/modules/cart/stores/cartStore'

interface AppliedVoucher {
  code: string
  discount_amount: number
  discount_type?: string | null
  value: number
  max_discount?: number | null
}

interface CheckoutSummaryCardProps {
  displayItems: CartItem[]
  subtotal: number
  shippingCost: number
  discountAmount: number
  totalAmount: number
  voucherCodeInput: string
  onVoucherInputChange: (val: string) => void
  appliedVoucher: AppliedVoucher | null
  onApplyVoucher: () => void
  onApplyVoucherDirectly: (code: string) => void
  onRemoveVoucher: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableVouchers: any[]
  voucherLoading: boolean
  onPaymentSubmit: () => void
  isCheckoutProcessing: boolean
  isPaymentTokenLoading: boolean
  canSubmit: boolean
}

export function CheckoutSummaryCard({
  displayItems,
  subtotal,
  shippingCost,
  discountAmount,
  totalAmount,
  voucherCodeInput,
  onVoucherInputChange,
  appliedVoucher,
  onApplyVoucher,
  onApplyVoucherDirectly,
  onRemoveVoucher,
  availableVouchers,
  voucherLoading,
  onPaymentSubmit,
  isCheckoutProcessing,
  isPaymentTokenLoading,
  canSubmit,
}: CheckoutSummaryCardProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 p-6 bg-white rounded-none shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
      <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-black mb-6 flex items-center border-b border-neutral-100 pb-3">
        <ShoppingBag size={14} className="mr-2 text-neutral-500" /> Ringkasan Pesanan
      </h2>

      {/* Items List */}
      <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1 mb-6">
        {displayItems.map((item) => (
          <div key={item.variantId} className="py-3 flex space-x-3 text-xs">
            {item.imageUrl && (
              <div className="relative w-10 h-14 border border-neutral-100 rounded-none bg-neutral-50 flex-shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.productName || item.name}
                  className="object-cover"
                  fill
                  sizes="40px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-brand-black uppercase tracking-wide truncate text-[11px]">
                {item.productName || item.name}
              </p>
              {item.variantName && (
                <p className="text-[9px] text-neutral-400 uppercase tracking-wider">
                  {item.variantName}
                </p>
              )}
              <p className="text-[10px] text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="font-sans font-semibold text-brand-black">
                {formatIDR(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Voucher Code Form */}
      <div className="pb-6 border-b border-neutral-100 mb-6">
        <label className="block text-[10px] uppercase tracking-widest font-heading font-bold text-neutral-400 mb-2">
          Punya Kode Voucher?
        </label>
        <AnimatePresence mode="wait">
          {appliedVoucher ? (
            <motion.div
              key="applied"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="flex items-center justify-between bg-brand-gold-muted/10 border border-brand-gold px-4 py-2.5 rounded-none text-xs"
            >
              <div className="flex items-center space-x-2 text-brand-gold font-heading font-medium uppercase tracking-wider text-[10px]">
                <Tag size={12} className="text-neutral-500" />
                <span>{appliedVoucher.code} diterapkan</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onRemoveVoucher}
                className="text-red-500 font-bold hover:text-red-700 transition ml-2"
              >
                Hapus
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Masukkan kode voucher"
                  className="flex-1 px-3 py-2 border border-neutral-200 focus:border-brand-black outline-none text-xs uppercase rounded-none transition-colors duration-200 focus-ring-premium"
                  value={voucherCodeInput}
                  onChange={(e) => onVoucherInputChange(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider"
                  onClick={onApplyVoucher}
                  isLoading={voucherLoading}
                >
                  Pakai
                </Button>
              </div>

              {/* Available Vouchers suggestions */}
              {availableVouchers && availableVouchers.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400 block">
                    Voucher Tersedia (Klik untuk Memakai)
                  </span>
                  <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {availableVouchers.map((voucher) => {
                      const isSpendMet = subtotal >= voucher.min_purchase
                      return (
                        <button
                          key={voucher.id}
                          type="button"
                          disabled={!isSpendMet}
                          onClick={() => onApplyVoucherDirectly(voucher.code)}
                          className={`flex-shrink-0 text-left p-2.5 border transition-all duration-200 w-36 rounded-none relative overflow-hidden select-none ${
                            isSpendMet
                              ? 'border-brand-gold/40 bg-brand-gold-muted/5 hover:bg-brand-gold-muted/10 cursor-pointer animate-pulse-gentle'
                              : 'border-neutral-200 bg-neutral-50/50 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-heading font-bold text-[10px] text-brand-gold uppercase tracking-wider">
                              {voucher.code}
                            </span>
                          </div>
                          <div className="text-[9px] text-neutral-500 font-sans line-clamp-1 mb-1">
                            {voucher.name}
                          </div>
                          <div className="text-[9px] font-heading font-bold text-neutral-700">
                            {voucher.discount_type === 'percentage'
                              ? `${voucher.value}% OFF`
                              : `${formatIDR(voucher.value)} OFF`}
                          </div>
                          <div className="text-[8px] text-neutral-400 font-sans">
                            Min. Belanja: {formatIDR(voucher.min_purchase)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Cost Calculation Details */}
      <div className="space-y-3 text-xs text-neutral-500 border-b border-neutral-100 pb-5 mb-5 font-sans">
        <div className="flex justify-between">
          <span>Subtotal Produk</span>
          <span className="font-semibold text-brand-black">{formatIDR(subtotal)}</span>
        </div>
        {appliedVoucher && (
          <div className="flex justify-between font-semibold">
            <span>Diskon Voucher</span>
            <span className="text-red-600">- {formatIDR(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Ongkos Kirim</span>
          <span className="font-semibold text-brand-black">
            {shippingCost > 0 ? formatIDR(shippingCost) : 'Pilih kurir...'}
          </span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex justify-between items-center text-brand-black font-heading mb-8">
        <span className="text-xs uppercase tracking-widest font-medium">Total Pembayaran</span>
        <span className="text-lg font-bold">{formatIDR(totalAmount)}</span>
      </div>

      {/* Payment trigger button */}
      <Button
        type="button"
        variant="primary"
        onClick={onPaymentSubmit}
        isLoading={isCheckoutProcessing}
        loadingText={isPaymentTokenLoading ? 'Menghubungi Midtrans...' : 'Memproses Pesanan...'}
        className="w-full py-4 text-xs uppercase tracking-widest font-semibold"
        disabled={!canSubmit}
      >
        Bayar Sekarang
      </Button>
    </div>
  )
}
