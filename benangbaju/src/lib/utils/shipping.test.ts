import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCourierLabel,
  formatWeight,
  estimateDeliveryDate,
} from './shipping'

describe('shipping utilities', () => {
  describe('getCourierLabel', () => {
    it('returns "JNE Express" for inputs containing "jne"', () => {
      expect(getCourierLabel('jne')).toBe('JNE Express')
      expect(getCourierLabel('JNE REG')).toBe('JNE Express')
      expect(getCourierLabel('jne YES')).toBe('JNE Express')
    })

    it('returns "TIKI" for inputs containing "tiki"', () => {
      expect(getCourierLabel('tiki')).toBe('TIKI')
      expect(getCourierLabel('TIKI ONS')).toBe('TIKI')
    })

    it('returns "POS Indonesia" for inputs containing "pos"', () => {
      expect(getCourierLabel('pos')).toBe('POS Indonesia')
      expect(getCourierLabel('POS Kilat')).toBe('POS Indonesia')
    })

    it('returns "J&T Express" for inputs containing "j&t" or "jnt"', () => {
      expect(getCourierLabel('j&t')).toBe('J&T Express')
      expect(getCourierLabel('J&T EZ')).toBe('J&T Express')
      expect(getCourierLabel('jnt')).toBe('J&T Express')
    })

    it('returns "SiCepat" for inputs containing "sicepat"', () => {
      expect(getCourierLabel('sicepat')).toBe('SiCepat')
      expect(getCourierLabel('SiCepat BEST')).toBe('SiCepat')
    })

    it('returns the original input if no known courier matches', () => {
      expect(getCourierLabel('AnterAja')).toBe('AnterAja')
      expect(getCourierLabel('Ninja Xpress')).toBe('Ninja Xpress')
    })
  })

  describe('formatWeight', () => {
    it('formats weight in grams for weights under 1000g', () => {
      expect(formatWeight(500)).toBe('500 gr')
      expect(formatWeight(999)).toBe('999 gr')
      expect(formatWeight(0)).toBe('0 gr')
    })

    it('formats weight in kilograms for weights 1000g and above', () => {
      expect(formatWeight(1000)).toBe('1.00 kg')
      expect(formatWeight(1500)).toBe('1.50 kg')
      expect(formatWeight(2550)).toBe('2.55 kg')
    })
  })

  describe('estimateDeliveryDate', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('estimates delivery date range correctly based on current date', () => {
      // Set fixed date to 2024-01-01 (Monday)
      const mockDate = new Date(2024, 0, 1, 12, 0, 0)
      vi.setSystemTime(mockDate)

      const result = estimateDeliveryDate(2, 4)

      // Expected: 2024-01-03 (Wednesday) - 2024-01-05 (Friday)
      // Format: weekday: 'long', day: 'numeric', month: 'long' in id-ID locale
      // id-ID format string for Jan 3: Rabu, 3 Januari
      // Wait, let's just make sure it returns the correct date string based on the locale

      // Actually, since locale string might differ slightly depending on the environment,
      // let's dynamically generate the expected string using the same format logic
      const format = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      }

      const expectedMinDate = new Date(mockDate)
      expectedMinDate.setDate(mockDate.getDate() + 2)

      const expectedMaxDate = new Date(mockDate)
      expectedMaxDate.setDate(mockDate.getDate() + 4)

      const expectedString = `${format(expectedMinDate)} - ${format(expectedMaxDate)}`

      expect(result).toBe(expectedString)
    })

    it('handles month overflow correctly', () => {
      // Set fixed date to 2024-01-30
      const mockDate = new Date(2024, 0, 30, 12, 0, 0)
      vi.setSystemTime(mockDate)

      const result = estimateDeliveryDate(2, 5)

      const format = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      }

      const expectedMinDate = new Date(mockDate)
      expectedMinDate.setDate(mockDate.getDate() + 2) // Feb 1

      const expectedMaxDate = new Date(mockDate)
      expectedMaxDate.setDate(mockDate.getDate() + 5) // Feb 4

      const expectedString = `${format(expectedMinDate)} - ${format(expectedMaxDate)}`

      expect(result).toBe(expectedString)
    })
  })
})
