'use client'

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, HandDrawnIcon } from '@/shared/components'
import { formatIDR, formatMYR } from '@/lib/utils'
import { QRIS_MAX_AMOUNT_IDR } from '@/lib/constants'
import type { CartItem } from '@/modules/cart/stores/cartStore'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface AppliedVoucher {
  code: string
  currency?: 'IDR' | 'MYR'
  discount_amount: number
  discount_type?: string | null
  value: number
  max_discount?: number | null
}

interface CheckoutSummaryCardProps {
  displayItems: CartItem[]
  subtotal: number
  shippingCost: number
  paymentFee?: number
  discountAmount: number
  totalAmount: number
  subtotalMyr?: number
  shippingCostMyr?: number
  paymentFeeMyr?: number
  discountAmountMyr?: number
  totalMyr?: number
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
  selectedChannelCode?: string | null
  isMalaysia?: boolean
  myrExchangeRate?: number
}

export function CheckoutSummaryCard({
  displayItems,
  subtotal,
  shippingCost,
  paymentFee = 0,
  discountAmount,
  totalAmount,
  subtotalMyr = 0,
  shippingCostMyr = 0,
  paymentFeeMyr = 0,
  discountAmountMyr = 0,
  totalMyr = 0,
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
  selectedChannelCode = null,
  isMalaysia = false,
  myrExchangeRate = 3600,
}: CheckoutSummaryCardProps): React.JSX.Element {
  const isQris = selectedChannelCode?.toUpperCase() === 'QRIS' || isMalaysia
  const isQrisLimitExceeded = isQris && totalAmount > QRIS_MAX_AMOUNT_IDR
  const itemSubtotalMyr = subtotalMyr

  return (
    <div className="border border-brand-plum/10 p-6 bg-brand-cream rounded-2xl shadow-xs relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-brand-blush to-brand-blue" />
      <h2 className="text-base font-serif font-medium tracking-tight text-brand-plum mb-6 flex items-center justify-between border-b border-brand-plum/10 pb-3">
        <span className="flex items-center">
          <HandDrawnIcon name="shopping-bag" className="h-4 w-4 mr-2" /> {isMalaysia ? 'Order Summary' : 'Ringkasan Pesanan'}
        </span>
      </h2>

      {/* Items List */}
      <div className="divide-y divide-brand-plum/10 max-h-60 overflow-y-auto pr-1 mb-6">
        {displayItems.map((item) => (
          <div key={item.variantId} className="py-3 flex space-x-3 text-xs">
            {item.imageUrl && (
              <div className="relative w-10 h-14 border border-brand-plum/10 rounded-lg overflow-hidden bg-brand-rose-soft/65 flex-shrink-0">
                <Image
                  src={getProxiedImageUrl(item.imageUrl)}
                  alt={item.productName || item.name}
                  className="object-cover"
                  fill
                  sizes="40px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-serif font-medium text-brand-plum truncate text-[13px] leading-snug">
                {item.productName || item.name}
              </p>
              {item.variantName && (
                <p className="text-[10px] text-neutral-500 font-sans font-medium mt-0.5">
                  {item.variantName}
                </p>
              )}
              <p className="text-[10px] text-neutral-400 mt-0.5 font-sans">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              {isMalaysia ? (
                item.priceMyr != null && item.priceMyr > 0 ? (
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="font-sans font-bold text-brand-plum">
                      {formatMYR(item.priceMyr * item.quantity)}
                    </span>
                    {item.comparePriceMyr && item.comparePriceMyr > item.priceMyr && (
                      <span className="text-[10px] text-neutral-400 line-through font-sans">
                        {formatMYR(item.comparePriceMyr * item.quantity)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-red-600">
                    Unavailable for MY
                  </span>
                )
              ) : (
                <div className="flex items-center justify-end space-x-1.5">
                  <span className="font-sans font-bold text-brand-plum">
                    {formatIDR(item.price * item.quantity)}
                  </span>
                  {item.comparePrice && item.comparePrice > item.price && (
                    <span className="text-[10px] text-neutral-400 line-through font-sans">
                      {formatIDR(item.comparePrice * item.quantity)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Voucher Code Form */}
      <div className="pb-6 border-b border-neutral-100 mb-6">
        <label className="block text-[10px] uppercase tracking-widest font-heading font-bold text-neutral-400 mb-2">
          {isMalaysia ? 'Enter Promo Code' : 'Masukkan Kode Voucher'}
        </label>
        <AnimatePresence mode="wait">
          {appliedVoucher ? (
            <motion.div
              key="applied"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="flex items-center justify-between bg-brand-accent-muted/10 border border-brand-accent px-4 py-2.5 rounded-xl text-xs"
            >
              <div className="flex items-center space-x-2 text-brand-plum font-heading font-medium uppercase tracking-wider text-[10px]">
                <HandDrawnIcon name="tag" className="h-3 w-3" />
                <span>{appliedVoucher.code} {isMalaysia ? 'applied' : 'diterapkan'}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onRemoveVoucher}
                className="text-red-500 font-bold hover:text-red-700 transition ml-2"
              >
                {isMalaysia ? 'Remove' : 'Hapus'}
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder={isMalaysia ? 'Enter promo code' : 'Masukkan kode voucher'}
                  className="flex-1 px-3 py-2 border border-neutral-200 focus:border-brand-plum outline-none text-xs uppercase rounded-xl transition-colors duration-200 focus-ring-premium"
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
                  {isMalaysia ? 'Apply' : 'Pakai'}
                </Button>
              </div>

              {/* Available Vouchers suggestions */}
              {availableVouchers && availableVouchers.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400 block">
                    {isMalaysia ? 'Available Promo Vouchers' : 'Pilih Voucher Tersedia'}
                  </span>
                  <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {availableVouchers.map((voucher) => {
                      const isVoucherMYR = voucher.currency === 'MYR'
                      const effMinSpend = isMalaysia
                        ? isVoucherMYR
                          ? Number(voucher.min_purchase || 0)
                          : Number((Number(voucher.min_purchase || 0) / myrExchangeRate).toFixed(2))
                        : Number(voucher.min_purchase || 0)
                      const effVal = isMalaysia
                        ? isVoucherMYR
                          ? Number(voucher.value || 0)
                          : Number((Number(voucher.value || 0) / myrExchangeRate).toFixed(2))
                        : Number(voucher.value || 0)
                      const effMaxDisc = voucher.max_discount
                        ? isMalaysia
                          ? isVoucherMYR
                            ? Number(voucher.max_discount)
                            : Number((Number(voucher.max_discount) / myrExchangeRate).toFixed(2))
                          : Number(voucher.max_discount)
                        : null
                      const isSpendMet = isMalaysia
                        ? itemSubtotalMyr >= effMinSpend
                        : subtotal >= effMinSpend
                      return (
                        <button
                          key={voucher.id}
                          type="button"
                          disabled={!isSpendMet}
                          onClick={() => onApplyVoucherDirectly(voucher.code)}
                          className={`flex-shrink-0 text-left p-2.5 border transition-all duration-200 w-36 rounded-xl relative overflow-hidden select-none ${
                            isSpendMet
                              ? 'border-brand-accent/40 bg-brand-accent-muted/5 hover:bg-brand-accent-muted/10 cursor-pointer animate-pulse-gentle'
                              : 'border-neutral-200 bg-neutral-50/50 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-heading font-bold text-[10px] text-brand-plum uppercase tracking-wider">
                              {voucher.code}
                            </span>
                          </div>
                          <div className="text-[9px] text-neutral-500 font-sans line-clamp-1 mb-1">
                            {voucher.name}
                          </div>
                          <div className="text-[9px] font-heading font-bold text-neutral-700">
                            {voucher.discount_type === 'percentage'
                              ? `${voucher.value}% OFF${
                                  effMaxDisc
                                    ? isMalaysia
                                      ? ` (Max ${formatMYR(effMaxDisc)})`
                                      : ` (Maks ${formatIDR(effMaxDisc)})`
                                    : ''
                                }`
                              : isMalaysia
                                ? `${formatMYR(effVal)} OFF`
                                : `${formatIDR(effVal)} OFF`}
                          </div>
                          <div className="text-[8px] text-neutral-400 font-sans">
                            {isMalaysia
                              ? `Min. Spend: ${formatMYR(effMinSpend)}`
                              : `Min. Belanja: ${formatIDR(effMinSpend)}`}
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
        <div className="flex justify-between items-baseline">
          <span>{isMalaysia ? 'Item Subtotal' : 'Subtotal Produk'}</span>
          <div className="text-right">
            <span className="font-semibold text-brand-plum">
              {isMalaysia ? formatMYR(itemSubtotalMyr) : formatIDR(subtotal)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-baseline">
          <span>{isMalaysia ? 'Shipping Fee' : 'Ongkos Kirim'}</span>
          <div className="text-right">
            <span className="font-semibold text-brand-plum">
              {isMalaysia
                ? shippingCostMyr > 0
                  ? formatMYR(shippingCostMyr)
                  : 'Select courier...'
                : shippingCost > 0
                  ? formatIDR(shippingCost)
                  : 'Pilih kurir...'}
            </span>
          </div>
        </div>

        {(isMalaysia ? paymentFeeMyr > 0 : paymentFee > 0) && (
          <div className="flex justify-between items-baseline">
            <span>{isMalaysia ? 'Payment Service Fee' : 'Biaya Layanan Pembayaran'}</span>
            <div className="text-right">
              <span className="font-semibold text-brand-plum">
                {isMalaysia ? formatMYR(paymentFeeMyr) : formatIDR(paymentFee)}
              </span>
            </div>
          </div>
        )}

        {appliedVoucher && (
          <div className="flex justify-between items-baseline font-semibold">
            <span>{isMalaysia ? 'Voucher Discount' : 'Diskon Voucher'}</span>
            <div className="text-right text-red-600">
              <span>
                - {isMalaysia ? formatMYR(discountAmountMyr) : formatIDR(discountAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-brand-plum font-heading">
          <span className="text-xs uppercase tracking-widest font-medium">
            {isMalaysia ? 'Grand Total' : 'Total Pembayaran'}
          </span>
          <span className="text-lg font-bold">
            {isMalaysia ? formatMYR(totalMyr) : formatIDR(totalAmount)}
          </span>
        </div>
        {isMalaysia && (
          <div className="text-right mt-1.5 pt-1.5 border-t border-neutral-200/50">
            <span className="text-xs font-semibold text-neutral-500 font-sans">
              ≈ {formatIDR(totalAmount)}
            </span>
            <p className="text-[10px] text-neutral-400 mt-0.5 font-sans">
              *Charged in IDR via QRIS (DuitNow / Touch &apos;n Go). Your bank&apos;s rate may differ slightly.
            </p>
          </div>
        )}
      </div>

      {/* QRIS Limit Exceeded Warning */}
      {isQrisLimitExceeded && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-sans leading-relaxed">
          <p className="font-bold flex items-center gap-1.5">
            <HandDrawnIcon name="alert-triangle" className="h-3.5 w-3.5 text-red-600 shrink-0" />
            <span>Transaksi Melebihi Batas QRIS</span>
          </p>
          <p className="text-[11px] mt-1 text-red-600">
            Maksimal transaksi QRIS Cross-Border adalah {formatIDR(QRIS_MAX_AMOUNT_IDR)}. Silakan kurangi jumlah pesanan untuk melanjutkan checkout.
          </p>
        </div>
      )}

      {/* Neutral De Minimis Customs notice (B2-5) */}
      {isMalaysia && itemSubtotalMyr >= 450 && (
        <div className="mb-6 p-3.5 bg-neutral-100/80 border border-neutral-200/80 rounded-xl text-neutral-600 text-xs font-sans leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-neutral-800 text-[11px] uppercase tracking-wide">
            <HandDrawnIcon name="alert-triangle" className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
            <span>Customs & Import Notice</span>
          </p>
          <p className="text-[11px] mt-1 text-neutral-600">
            Orders shipped to Malaysia with item subtotal exceeding <strong>RM 500</strong> may be subject to Malaysian customs import duty and sales tax upon arrival.
          </p>
        </div>
      )}

      {/* Payment trigger button */}
      <Button
        type="button"
        variant="accent"
        onClick={onPaymentSubmit}
        isLoading={isCheckoutProcessing}
        loadingText={isPaymentTokenLoading ? (isMalaysia ? 'Connecting to payment gateway...' : 'Menghubungi DOKU...') : (isMalaysia ? 'Processing order...' : 'Memproses Pesanan...')}
        className="w-full py-4 text-xs uppercase tracking-widest font-bold"
        disabled={!canSubmit || isQrisLimitExceeded}
      >
        {isMalaysia ? 'Pay Now' : 'Bayar Sekarang'}
      </Button>

      {/* Mini Trust Badges */}
      <div className="flex items-center justify-center space-x-6 mt-6">
        <div className="flex items-center space-x-1.5 text-neutral-400">
          <HandDrawnIcon name="lock" className="h-3 w-3" />
          <span className="text-[9px] font-sans">{isMalaysia ? 'Secure Payment' : 'Pembayaran Aman'}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-neutral-400">
          <HandDrawnIcon name="clothes" className="h-3 w-3" />
          <span className="text-[9px] font-sans">100% Original</span>
        </div>
      </div>
    </div>
  )
}
