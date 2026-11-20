'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { HandDrawnIcon, MarketFlagIcon } from '@/shared/components'
import type { HandDrawnIconName } from '@/shared/components'
import { formatIDR, formatMYR } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import type { PaymentFeeConfig } from '@/modules/orders/types'

interface PaymentMethodSelectorProps {
  feeConfigs: PaymentFeeConfig[]
  selectedChannelCode: string | null
  onSelectChannel: (channel: PaymentFeeConfig, calculatedFee: number) => void
  subtotal: number
  shippingCost: number
  discountAmount: number
  baseAmountMyr?: number
  myrExchangeRate?: number
  loading?: boolean
  countryCode?: string
}

export function calculateChannelFee(
  config: PaymentFeeConfig,
  baseAmount: number
): number {
  if (!config) return 0
  let fee = 0
  if (config.fee_type === 'flat') {
    fee = config.fee_flat
  } else if (config.fee_type === 'percentage') {
    fee = Math.round(baseAmount * (config.fee_percentage / 100))
  } else if (config.fee_type === 'flat_and_percentage') {
    fee = config.fee_flat + Math.round(baseAmount * (config.fee_percentage / 100))
  }
  return Math.max(0, fee)
}

export function calculateChannelFeeMyr(
  config: PaymentFeeConfig,
  baseAmountMyr: number,
  exchangeRate = 3600
): number {
  if (!config) return 0
  let feeMyr = 0
  if (config.fee_type === 'flat') {
    feeMyr = Number((config.fee_flat / exchangeRate).toFixed(2))
  } else if (config.fee_type === 'percentage') {
    feeMyr = Number((baseAmountMyr * (config.fee_percentage / 100)).toFixed(2))
  } else if (config.fee_type === 'flat_and_percentage') {
    feeMyr = Number(
      (config.fee_flat / exchangeRate + baseAmountMyr * (config.fee_percentage / 100)).toFixed(2)
    )
  }
  return Math.max(0, feeMyr)
}

const CATEGORY_LABELS: Record<string, { label: string; iconName: HandDrawnIconName }> = {
  virtual_account: { label: 'Virtual Account (Transfer Bank)', iconName: 'tag' },
  qris: { label: 'QRIS (Semua Aplikasi Bank & E-Wallet)', iconName: 'sparkles' },
  ewallet: { label: 'E-Wallet', iconName: 'shopping-bag' },
  minimarket: { label: 'Minimarket (Bayar di Kasir)', iconName: 'map-pin' },
}

export function PaymentMethodSelector({
  feeConfigs,
  selectedChannelCode,
  onSelectChannel,
  subtotal,
  shippingCost,
  discountAmount,
  baseAmountMyr,
  myrExchangeRate = 3600,
  loading = false,
  countryCode = 'ID',
}: PaymentMethodSelectorProps): React.JSX.Element {
  const market = useMarket()
  const isMY = countryCode === 'MY' || market === 'MY'
  const isMalaysia = countryCode === 'MY'
  const baseAmount = Math.max(0, subtotal + shippingCost - discountAmount)
  const effectiveBaseMyr =
    baseAmountMyr != null ? baseAmountMyr : Number((baseAmount / myrExchangeRate).toFixed(2))

  const activeConfigs = useMemo(() => {
    const list = (feeConfigs || []).filter((c) => c.is_active)
    if (isMalaysia) {
      // In Malaysia, only cross-border QRIS (DuitNow) is supported
      return list.filter((c) => c.category === 'qris' || c.channel_code?.toUpperCase() === 'QRIS')
    }
    return list
  }, [feeConfigs, isMalaysia])

  const groupedConfigs = useMemo(() => {
    const groups: Record<string, PaymentFeeConfig[]> = {
      virtual_account: [],
      qris: [],
      ewallet: [],
      minimarket: [],
    }
    activeConfigs.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = []
      groups[c.category].push(c)
    })
    return groups
  }, [activeConfigs])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-brand-rose-soft/60 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-20 bg-brand-rose-soft/45 animate-pulse rounded-2xl" />
          <div className="h-20 bg-brand-rose-soft/45 animate-pulse rounded-2xl" />
          <div className="h-20 bg-brand-rose-soft/45 animate-pulse rounded-2xl" />
          <div className="h-20 bg-brand-rose-soft/45 animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-plum/10 pb-3">
        <h2 className="text-base font-serif font-medium tracking-tight text-brand-plum flex items-center gap-2">
          <HandDrawnIcon name="tag" className="h-4 w-4 text-brand-plum" />
          <span>{isMY ? 'Payment Method' : 'Metode Pembayaran'}</span>
        </h2>
        <span className="text-[11px] text-neutral-500 font-sans">
          {isMalaysia
            ? isMY
              ? 'International Payment'
              : 'Pembayaran Internasional'
            : isMY
              ? 'Choose automated payment'
              : 'Pilih metode bayar otomatis'}
        </span>
      </div>

      {isMalaysia && (
        <div className="p-4 bg-gradient-to-br from-brand-gold-soft/75 via-amber-50/50 to-brand-cream border border-brand-gold-stroke/60 text-xs rounded-2xl space-y-3 font-sans shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-gold-stroke/40 pb-2.5">
            <div className="flex items-center gap-2.5">
              <MarketFlagIcon market="MY" className="w-5 h-5" />
              <div>
                <span className="font-serif font-medium text-amber-950 text-sm block leading-tight">
                  DuitNow QR / Cross-Border QRIS
                </span>
                <span className="text-[10px] text-amber-800">
                  {isMY
                    ? 'Official Bank Negara Malaysia & Bank Indonesia payment link'
                    : 'Kerjasama resmi Bank Indonesia & Bank Negara Malaysia'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300/60">
              Instant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-2.5 bg-white/80 rounded-xl border border-amber-200/60">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                1
              </div>
              <div className="text-[11px] leading-snug">
                <strong className="block text-neutral-800">
                  {isMY ? 'Open Bank / E-Wallet' : 'Buka Bank / E-Wallet'}
                </strong>
                <span className="text-neutral-500 text-[10px]">
                  Touch &apos;n Go, MAE, CIMB Octo, PB engage, dll.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-white/80 rounded-xl border border-amber-200/60">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                2
              </div>
              <div className="text-[11px] leading-snug">
                <strong className="block text-neutral-800">
                  {isMY ? 'Scan DuitNow QR' : 'Pindai Kode QRIS'}
                </strong>
                <span className="text-neutral-500 text-[10px]">
                  {isMY
                    ? 'Scan screen directly or upload screenshot'
                    : 'Scan langsung atau unggah tangkapan layar'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-white/80 rounded-xl border border-amber-200/60">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                3
              </div>
              <div className="text-[11px] leading-snug">
                <strong className="block text-neutral-800">
                  {isMY ? 'Real-time MYR Rate' : 'Konversi Otomatis MYR'}
                </strong>
                <span className="text-neutral-500 text-[10px]">
                  {isMY
                    ? 'Total in RM auto-converted on phone screen'
                    : 'Nominal tertera otomatis dalam Ringgit (RM)'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-white/80 rounded-xl border border-amber-200/60">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                4
              </div>
              <div className="text-[11px] leading-snug">
                <strong className="block text-neutral-800">
                  {isMY ? 'Instant Verification' : 'Verifikasi Otomatis'}
                </strong>
                <span className="text-neutral-500 text-[10px]">
                  {isMY
                    ? 'Authorize with PIN, order verified instantly'
                    : 'Masukkan PIN, pesanan langsung terverifikasi'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([category, items]) => {
          if (items.length === 0) return null
          const categoryMeta = CATEGORY_LABELS[category] || { label: category, iconName: 'tag' }

          return (
            <div key={category} className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum/60 flex items-center">
                <HandDrawnIcon name={categoryMeta.iconName} className="h-3 w-3 mr-1.5 text-brand-plum/70" />{' '}
                {isMalaysia ? 'QRIS / DuitNow Cross-Border' : categoryMeta.label}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => {
                  const fee = calculateChannelFee(item, baseAmount)
                  const feeMyr = calculateChannelFeeMyr(item, effectiveBaseMyr, myrExchangeRate)
                  const isSelected = selectedChannelCode === item.channel_code

                  return (
                    <motion.button
                      key={item.channel_code}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => onSelectChannel(item, fee)}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between select-none cursor-pointer ${
                        isSelected
                          ? 'border-brand-plum bg-brand-blush/30 shadow-xs ring-1 ring-brand-plum/70'
                          : 'border-brand-plum/10 bg-white/85 hover:border-brand-blue hover:bg-brand-cream'
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <div>
                          <span className="font-sans font-bold text-xs text-brand-plum block">
                            {isMalaysia ? 'QRIS / DuitNow Malaysia' : item.channel_name}
                          </span>
                          <span className="text-[10px] font-sans text-neutral-500 mt-0.5 block">
                            {isMalaysia
                              ? item.fee_type === 'percentage'
                                ? `Fee: +${item.fee_percentage}% (${formatMYR(feeMyr)})`
                                : `Fee: +${formatMYR(feeMyr)}`
                              : item.fee_type === 'flat'
                                ? `Biaya: +${formatIDR(item.fee_flat)}`
                                : item.fee_type === 'percentage'
                                  ? `Biaya: +${item.fee_percentage}% (${formatIDR(fee)})`
                                  : `Biaya: +${formatIDR(item.fee_flat)} + ${item.fee_percentage}%`}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'border-brand-plum bg-brand-plum text-white'
                              : 'border-brand-plum/25 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
