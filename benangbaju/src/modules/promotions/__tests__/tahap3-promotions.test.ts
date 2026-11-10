import { describe, it, expect } from 'vitest'
import { getMyPrice, formatMYR } from '@/lib/utils/pricing'
import { formatIDR } from '@/lib/utils/format'

describe('Tahap 3 Promotions & Payment Unit Tests', () => {
  describe('Flash Sale Target Market filtering', () => {
    interface FlashSaleItem {
      id: string
      target_market: 'ALL' | 'ID' | 'MY'
    }

    const flashSales: FlashSaleItem[] = [
      { id: 'fs-global', target_market: 'ALL' },
      { id: 'fs-id-only', target_market: 'ID' },
      { id: 'fs-my-only', target_market: 'MY' },
    ]

    const filterForMarket = (sales: FlashSaleItem[], market: 'ID' | 'MY') => {
      return sales.filter(
        (s) => !s.target_market || s.target_market === 'ALL' || s.target_market === market
      )
    }

    it('should show ALL and ID flash sales to Indonesian customers', () => {
      const result = filterForMarket(flashSales, 'ID')
      expect(result.map((s) => s.id)).toEqual(['fs-global', 'fs-id-only'])
    })

    it('should show ALL and MY flash sales to Malaysian customers', () => {
      const result = filterForMarket(flashSales, 'MY')
      expect(result.map((s) => s.id)).toEqual(['fs-global', 'fs-my-only'])
    })

    it('should restore regular_price on cached product variants when flash sale target_market mismatches active market', () => {
      const cachedVariant = {
        id: 'v-1',
        price: 150000, // flash sale price
        compare_price: 250000,
        regular_price: 250000,
        regular_compare_price: null,
        flash_sale_target_market: 'ID' as 'ALL' | 'ID' | 'MY',
      }

      const resolveVariantForMarket = (
        v: typeof cachedVariant,
        market: 'ID' | 'MY'
      ) => {
        if (
          v.flash_sale_target_market &&
          v.flash_sale_target_market !== 'ALL' &&
          v.flash_sale_target_market !== market &&
          v.regular_price !== undefined
        ) {
          return {
            ...v,
            price: v.regular_price,
            compare_price: v.regular_compare_price ?? null,
          }
        }
        return v
      }

      const forId = resolveVariantForMarket(cachedVariant, 'ID')
      expect(forId.price).toBe(150000)
      expect(forId.compare_price).toBe(250000)

      const forMy = resolveVariantForMarket(cachedVariant, 'MY')
      expect(forMy.price).toBe(250000)
      expect(forMy.compare_price).toBeNull()
    })
  })

  describe('Free Shipping Progress Calculation', () => {
    const config = {
      freeShippingThresholdIdr: 500000,
      freeShippingThresholdMyr: 150,
    }

    it('should calculate IDR progress correctly', () => {
      const subtotal = 250000
      const threshold = config.freeShippingThresholdIdr
      const isFree = subtotal >= threshold
      const remaining = Math.max(0, threshold - subtotal)
      const progressPercent = Math.min(100, (subtotal / threshold) * 100)

      expect(isFree).toBe(false)
      expect(remaining).toBe(250000)
      expect(progressPercent).toBe(50)
      expect(formatIDR(remaining)).toContain('250.000')
    })

    it('should unlock free shipping in IDR when threshold reached', () => {
      const subtotal = 550000
      const threshold = config.freeShippingThresholdIdr
      const isFree = subtotal >= threshold
      const remaining = Math.max(0, threshold - subtotal)
      const progressPercent = Math.min(100, (subtotal / threshold) * 100)

      expect(isFree).toBe(true)
      expect(remaining).toBe(0)
      expect(progressPercent).toBe(100)
    })

    it('should calculate MYR progress correctly in RM', () => {
      const totalMyr = 75
      const threshold = config.freeShippingThresholdMyr
      const isFree = totalMyr >= threshold
      const remaining = Math.max(0, threshold - totalMyr)
      const progressPercent = Math.min(100, (totalMyr / threshold) * 100)

      expect(isFree).toBe(false)
      expect(remaining).toBe(75)
      expect(progressPercent).toBe(50)
      expect(formatMYR(remaining)).toBe('RM 75.00')
    })

    it('should unlock free shipping in MYR when threshold reached', () => {
      const totalMyr = 160
      const threshold = config.freeShippingThresholdMyr
      const isFree = totalMyr >= threshold
      const remaining = Math.max(0, threshold - totalMyr)
      const progressPercent = Math.min(100, (totalMyr / threshold) * 100)

      expect(isFree).toBe(true)
      expect(remaining).toBe(0)
      expect(progressPercent).toBe(100)
    })
  })

  describe('De Minimis Customs Notice Logic (B2-5)', () => {
    const checkNotice = (totalMyr: number) => {
      const shouldShow = totalMyr >= 450
      const isExceeded = totalMyr >= 500
      return { shouldShow, isExceeded }
    }

    it('should not show notice below RM 450', () => {
      expect(checkNotice(300)).toEqual({ shouldShow: false, isExceeded: false })
      expect(checkNotice(449)).toEqual({ shouldShow: false, isExceeded: false })
    })

    it('should show advisory warning between RM 450 and RM 499', () => {
      const status = checkNotice(475)
      expect(status.shouldShow).toBe(true)
      expect(status.isExceeded).toBe(false)
    })

    it('should show SST duty warning when exceeding RM 500', () => {
      const status = checkNotice(550)
      expect(status.shouldShow).toBe(true)
      expect(status.isExceeded).toBe(true)
    })
  })

  describe('Voucher Malaysia Conversion (B2-13)', () => {
    it('should calculate RM minimum spend based on marked up chargedIdr', () => {
      const exchangeRate = 3600
      const markupPercent = 10
      const baseProductPrice = 100000 // Rp 100.000

      // In Malaysia market:
      const myPrice = getMyPrice(baseProductPrice, {
        exchangeRate,
        markupPercent,
        rounding: 'none',
      })

      // With 10% markup: priceMyr = RM 30.56, chargedIdr = 30.56 * 3600 = Rp 110.016
      expect(myPrice.chargedIdr).toBe(110016)
      expect(myPrice.priceMyr).toBeCloseTo(30.56, 1)

      // Voucher with min_purchase Rp 100.000 is satisfied by chargedIdr Rp 110.000
      const voucherMinPurchase = 100000
      const isValid = myPrice.chargedIdr >= voucherMinPurchase
      expect(isValid).toBe(true)

      // Nominal RM preview in admin for RM 10 voucher
      const voucherValueMyr = 10
      const requiredIdr = Math.round(voucherValueMyr * exchangeRate)
      expect(requiredIdr).toBe(36000)
    })
  })
})
