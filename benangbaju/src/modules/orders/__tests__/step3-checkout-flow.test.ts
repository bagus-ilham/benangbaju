import { describe, it, expect } from 'vitest'
import { calculateCartWeight } from '@/modules/shipping/shipping.utils'
import { formatApproxMYR, getCourierTrackingUrl, parseTrackingNumbers } from '@/lib/utils'
import { calculateChannelFee } from '@/app/(customer)/checkout/components/PaymentMethodSelector'
import { DEFAULT_WEIGHT_GRAM, QRIS_MAX_AMOUNT_IDR } from '@/lib/constants'
import type { PaymentFeeConfig } from '@/modules/orders/types'

describe('Step 3: Malaysia Shipping & Checkout Flow', () => {
  describe('Weight Fallback Synchronization', () => {
    it('uses DEFAULT_WEIGHT_GRAM (400g) when weight_gram is missing, 0, or invalid', () => {
      const items = [
        { product_variant_id: 'v1', quantity: 2, weight_gram: 0 },
        { product_variant_id: 'v2', quantity: 1, weight_gram: undefined },
        { product_variant_id: 'v3', quantity: 1, weight_gram: 600 },
        { product_variant_id: 'v4', quantity: 1, product_variants: { weight_gram: 500 } },
      ] as any

      const totalWeight = calculateCartWeight(items)
      // v1: 2 * 400 = 800
      // v2: 1 * 400 = 400
      // v3: 1 * 600 = 600
      // v4: 1 * 500 = 500
      // Total: 2300g
      expect(totalWeight).toBe(2300)
    })

    it('returns 0 for empty cart items', () => {
      expect(calculateCartWeight([])).toBe(0)
    })
  })

  describe('Approximate MYR Currency Formatting', () => {
    it('formats IDR to MYR with default rate of 3600', () => {
      expect(formatApproxMYR(360000, 3600)).toBe('≈ RM 100.00')
      expect(formatApproxMYR(180000, 3600)).toBe('≈ RM 50.00')
    })

    it('handles zero, negative, or invalid amounts gracefully', () => {
      expect(formatApproxMYR(0)).toBe('≈ RM 0.00')
      expect(formatApproxMYR(-5000)).toBe('≈ RM 0.00')
    })
  })

  describe('Courier Tracking Links & Parsing', () => {
    it('parses multiple tracking numbers separated by comma, semicolon, or newline', () => {
      const input = 'LP12345678, LP87654321; NV99999\nLP00000'
      const parsed = parseTrackingNumbers(input)
      expect(parsed).toEqual(['LP12345678', 'LP87654321', 'NV99999', 'LP00000'])
    })

    it('generates correct tracking URLs for supported couriers', () => {
      expect(getCourierTrackingUrl('Ninja Van MY', 'NVMY123456')).toContain('ninjavan.co/en-my/tracking?id=NVMY123456')
      expect(getCourierTrackingUrl('Lion Parcel INTERPACK', 'LP12345')).toContain('lionparcel.com/track/stt?q=LP12345')
      expect(getCourierTrackingUrl('Pos Malaysia', 'EN123456MY')).toContain('pos.com.my/tracking?trackingNo=EN123456MY')
      expect(getCourierTrackingUrl('Unknown Express', 'TRACK123')).toContain('17track.net')
    })
  })

  describe('Dynamic Payment Fee Calculation', () => {
    it('calculates percentage fee correctly (e.g. QRIS 0.777%)', () => {
      const qrisConfig: PaymentFeeConfig = {
        id: '1',
        channel_code: 'QRIS',
        channel_name: 'QRIS Cross-Border',
        category: 'qris',
        fee_type: 'percentage',
        fee_flat: 0,
        fee_percentage: 0.777,
        logo_url: null,
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Base amount = Rp 1.000.000 -> 0.777% = Rp 7.770
      const fee = calculateChannelFee(qrisConfig, 1000000)
      expect(fee).toBe(7770)
    })

    it('calculates flat fee correctly (e.g. VA Rp 4.000)', () => {
      const vaConfig: PaymentFeeConfig = {
        id: '2',
        channel_code: 'VIRTUAL_ACCOUNT_BCA',
        channel_name: 'BCA Virtual Account',
        category: 'virtual_account',
        fee_type: 'flat',
        fee_flat: 4000,
        fee_percentage: 0,
        logo_url: null,
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const fee = calculateChannelFee(vaConfig, 500000)
      expect(fee).toBe(4000)
    })
  })

  describe('Constants Verification', () => {
    it('has DEFAULT_WEIGHT_GRAM set to 400g and QRIS_MAX_AMOUNT_IDR set to 10.000.000', () => {
      expect(DEFAULT_WEIGHT_GRAM).toBe(400)
      expect(QRIS_MAX_AMOUNT_IDR).toBe(10_000_000)
    })
  })
})
