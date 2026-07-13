import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateCartWeight, validateAndGetShippingRate } from '../shipping.utils'
import { shippingService } from '../shipping.service'
import { DEFAULT_WEIGHT_GRAM } from '@/lib/constants'

vi.mock('../shipping.service')

describe('shipping.utils', () => {
  describe('calculateCartWeight', () => {
    it('should calculate weight correctly with provided variant weights', () => {
      const items = [
        { quantity: 2, product_variants: { weight_gram: 500 } },
        { quantity: 1, product_variants: { weight_gram: 200 } },
      ]
      expect(calculateCartWeight(items as any)).toBe(1200)
    })

    it('should fallback to product weight if variant weight is missing', () => {
      const items = [{ quantity: 2, product_variants: { products: { weight_gram: 600 } } }]
      expect(calculateCartWeight(items as any)).toBe(1200)
    })

    it('should fallback to DEFAULT_WEIGHT_GRAM if no weight is provided', () => {
      const items = [{ quantity: 3, product_variants: {} }]
      expect(calculateCartWeight(items as any)).toBe(3 * DEFAULT_WEIGHT_GRAM)
    })

    it('should handle empty cart', () => {
      expect(calculateCartWeight([])).toBe(0)
    })
  })

  describe('validateAndGetShippingRate', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return undefined if API call fails', async () => {
      vi.mocked(shippingService.calculateShippingRates).mockResolvedValue({ success: false } as any)
      const res = await validateAndGetShippingRate('zone1', 1000, {} as any)
      expect(res).toBeUndefined()
    })

    it('should return rate matching shippingRateId', async () => {
      const mockRates = [
        { id: 'rate1', price: 10000 },
        { id: 'rate2', price: 20000 },
      ]
      vi.mocked(shippingService.calculateShippingRates).mockResolvedValue({
        success: true,
        data: mockRates,
      } as any)

      const res = await validateAndGetShippingRate('zone1', 1000, {
        shippingRateId: 'rate2',
      } as any)
      expect(res).toEqual(mockRates[1])
    })
  })
})
