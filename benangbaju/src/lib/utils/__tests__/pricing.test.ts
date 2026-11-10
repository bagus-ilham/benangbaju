import { describe, it, expect } from 'vitest'
import {
  getMyPrice,
  getDisplayPrice,
  formatMYR,
  roundSen,
  type MyPriceRounding,
} from '../pricing'

describe('Malaysia Pricing Engine (pricing.ts)', () => {
  describe('roundSen', () => {
    it('handles 0 or negative sen', () => {
      expect(roundSen(0, 'none')).toBe(0)
      expect(roundSen(0, 'x.90')).toBe(0)
      expect(roundSen(0, 'whole')).toBe(0)
      expect(roundSen(-10, 'x.90')).toBe(0)
    })

    it('handles mode "none"', () => {
      expect(roundSen(7986, 'none')).toBe(7986)
      expect(roundSen(5000, 'none')).toBe(5000)
    })

    it('handles mode "x.90" without unwanted jumps on exact .90 values', () => {
      // 7986 sen (RM 79.86) -> 7990 sen (RM 79.90)
      expect(roundSen(7986, 'x.90')).toBe(7990)
      // 7990 sen (RM 79.90) -> must stay 7990 sen (RM 79.90)
      expect(roundSen(7990, 'x.90')).toBe(7990)
      // 7991 sen (RM 79.91) -> must round up to 8090 sen (RM 80.90)
      expect(roundSen(7991, 'x.90')).toBe(8090)
      // 5000 sen (RM 50.00) -> 5090 sen (RM 50.90)
      expect(roundSen(5000, 'x.90')).toBe(5090)
      // 10 sen (RM 0.10) -> 90 sen (RM 0.90)
      expect(roundSen(10, 'x.90')).toBe(90)
    })

    it('handles mode "whole" without unwanted jumps on exact whole values', () => {
      // 7986 sen -> 8000 sen
      expect(roundSen(7986, 'whole')).toBe(8000)
      // 8000 sen -> 8000 sen
      expect(roundSen(8000, 'whole')).toBe(8000)
      // 8001 sen -> 8100 sen
      expect(roundSen(8001, 'whole')).toBe(8100)
    })
  })

  describe('formatMYR', () => {
    it('formats properly with standard and approx prefixes', () => {
      expect(formatMYR(79.9)).toBe('RM 79.90')
      expect(formatMYR(79.9, true)).toBe('≈ RM 79.90')
      expect(formatMYR(0)).toBe('RM 0.00')
      expect(formatMYR(0, true)).toBe('≈ RM 0.00')
      expect(formatMYR(-5)).toBe('RM 0.00')
    })
  })

  describe('getMyPrice', () => {
    it('returns zeroes for zero or negative base IDR', () => {
      const res = getMyPrice(0)
      expect(res.priceMyr).toBe(0)
      expect(res.chargedIdr).toBe(0)
      expect(res.formattedMyr).toBe('RM 0.00')
      expect(res.formattedChargedIdr).toBe('Rp 0')
    })

    it('preserves exact base IDR when markup is 0% and rounding is "none" (Zero-downtime safety)', () => {
      const baseIdr = 250000
      const res = getMyPrice(baseIdr, { exchangeRate: 3600, markupPercent: 0, rounding: 'none' })
      expect(res.baseIdr).toBe(250000)
      expect(res.chargedIdr).toBe(250000)
      // 250000 / 3600 = 69.444... sen = 6944
      expect(res.rawSen).toBe(6944)
      expect(res.priceMyr).toBe(69.44)
      expect(res.formattedMyr).toBe('RM 69.44')
      expect(res.formattedChargedIdr).toBe('Rp 250.000')
    })

    it('calculates 15% markup and "x.90" psychological rounding matching specification', () => {
      // Example from specification:
      // Rp 250.000, rate 3600, markup 15%, rounding 'x.90'
      // raw_sen = ROUND((250000 * 115) / 3600) = 7986 (RM 79.86)
      // final_sen = 7990 (RM 79.90)
      // charged_idr = ROUND((7990 * 3600) / 100) = 287640
      const res = getMyPrice(250000, { exchangeRate: 3600, markupPercent: 15, rounding: 'x.90' })
      expect(res.rawSen).toBe(7986)
      expect(res.finalSen).toBe(7990)
      expect(res.priceMyr).toBe(79.9)
      expect(res.chargedIdr).toBe(287640)
      expect(res.formattedMyr).toBe('RM 79.90')
      expect(res.formattedChargedIdr).toBe('Rp 287.640')
    })

    it('works across 60 various price samples without NaN or inconsistency', () => {
      const roundingModes: MyPriceRounding[] = ['none', 'x.90', 'whole']
      for (let i = 1; i <= 60; i++) {
        const baseIdr = i * 10000 // 10k to 600k
        const markup = (i % 4) * 5 // 0%, 5%, 10%, 15%
        const rounding = roundingModes[i % 3]
        const rate = 3500 + (i % 5) * 50 // 3500 to 3700

        const res = getMyPrice(baseIdr, { exchangeRate: rate, markupPercent: markup, rounding })
        expect(res.priceMyr).toBeGreaterThan(0)
        expect(res.chargedIdr).toBeGreaterThan(0)
        expect(Number.isFinite(res.priceMyr)).toBe(true)
        expect(Number.isInteger(res.chargedIdr)).toBe(true)
        expect(res.formattedMyr.startsWith('RM ')).toBe(true)
        expect(res.formattedChargedIdr.startsWith('Rp ')).toBe(true)
      }
    })
  })

  describe('getDisplayPrice', () => {
    it('returns formatIDR only when market is ID', () => {
      const res = getDisplayPrice(150000, 'ID')
      expect(res.isMY).toBe(false)
      expect(res.primaryText).toBe('Rp 150.000')
      expect(res.secondaryText).toBeNull()
      expect(res.priceMyr).toBeNull()
      expect(res.chargedIdr).toBe(150000)
    })

    it('returns primary RM and secondary Rp when market is MY', () => {
      const res = getDisplayPrice(250000, 'MY', {
        exchangeRate: 3600,
        markupPercent: 15,
        rounding: 'x.90',
      })
      expect(res.isMY).toBe(true)
      expect(res.primaryText).toBe('RM 79.90')
      expect(res.secondaryText).toBe('≈ Rp 287.640')
      expect(res.priceMyr).toBe(79.9)
      expect(res.chargedIdr).toBe(287640)
    })
  })
})

