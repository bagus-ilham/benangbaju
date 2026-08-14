'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import type { PaymentFeeConfig } from '@/modules/orders/types'

interface PaymentMethodSelectorProps {
  feeConfigs: PaymentFeeConfig[]
  selectedChannelCode: string | null
  onSelectChannel: (channel: PaymentFeeConfig, calculatedFee: number) => void
  subtotal: number
  shippingCost: number
  discountAmount: number
  loading?: boolean
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

import type { HandDrawnIconName } from '@/shared/components'

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
  loading = false,
}: PaymentMethodSelectorProps): React.JSX.Element {
  const baseAmount = Math.max(0, subtotal + shippingCost - discountAmount)

  const activeConfigs = useMemo(() => {
    return (feeConfigs || []).filter((c) => c.is_active)
  }, [feeConfigs])

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
        <div className="h-6 w-48 bg-neutral-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-20 bg-neutral-100 animate-pulse rounded-xl" />
          <div className="h-20 bg-neutral-100 animate-pulse rounded-xl" />
          <div className="h-20 bg-neutral-100 animate-pulse rounded-xl" />
          <div className="h-20 bg-neutral-100 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-plum flex items-center">
          <HandDrawnIcon name="tag" className="h-3.5 w-3.5 mr-2 text-brand-plum" /> Metode Pembayaran Direct
        </h2>
        <span className="text-[10px] text-neutral-500 font-sans">Pilih metode bayar otomatis</span>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([category, items]) => {
          if (items.length === 0) return null
          const categoryMeta = CATEGORY_LABELS[category] || { label: category, iconName: 'tag' }

          return (
            <div key={category} className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-neutral-400 flex items-center">
                <HandDrawnIcon name={categoryMeta.iconName} className="h-3 w-3 mr-1.5" /> {categoryMeta.label}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => {
                  const fee = calculateChannelFee(item, baseAmount)
                  const isSelected = selectedChannelCode === item.channel_code

                  return (
                    <motion.button
                      key={item.channel_code}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => onSelectChannel(item, fee)}
                      className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between select-none ${
                        isSelected
                          ? 'border-brand-plum bg-brand-plum/5 shadow-xs ring-1 ring-brand-plum'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <div>
                          <span className="font-heading font-bold text-xs text-brand-plum block">
                            {item.channel_name}
                          </span>
                          <span className="text-[10px] font-sans text-neutral-400 mt-0.5 block">
                            {item.fee_type === 'flat'
                              ? `Biaya: +${formatIDR(item.fee_flat)}`
                              : item.fee_type === 'percentage'
                              ? `Biaya: +${item.fee_percentage}% (${formatIDR(fee)})`
                              : `Biaya: +${formatIDR(item.fee_flat)} + ${item.fee_percentage}%`}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-brand-plum bg-brand-plum text-white'
                              : 'border-neutral-300 bg-transparent'
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
