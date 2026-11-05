import { describe, it, expect } from 'vitest'
import {
  normalizePhoneE164,
  isValidPhoneByCountry,
  validateMalaysiaWestPostalCode,
  hasPoBoxAddress,
} from '../validation'
import { formatApproxMYR, buildWhatsAppUrl } from '../format'
import {
  getCourierLabel,
  getCourierTrackingUrl,
  parseTrackingNumbers,
} from '../shipping'
import { scoreProduct } from '@/modules/products/product-search'
import { useMarketStore } from '@/shared/stores/marketStore'

describe('Malaysia Shipping Utilities', () => {
  describe('normalizePhoneE164', () => {
    it('normalizes Indonesian phone numbers', () => {
      expect(normalizePhoneE164('081234567890', 'ID')).toBe('+6281234567890')
      expect(normalizePhoneE164('+6281234567890', 'ID')).toBe('+6281234567890')
      expect(normalizePhoneE164('6281234567890', 'ID')).toBe('+6281234567890')
      expect(normalizePhoneE164('0812-3456-7890', 'ID')).toBe('+6281234567890')
    })

    it('normalizes Malaysian phone numbers', () => {
      expect(normalizePhoneE164('0123456789', 'MY')).toBe('+60123456789')
      expect(normalizePhoneE164('+60123456789', 'MY')).toBe('+60123456789')
      expect(normalizePhoneE164('60123456789', 'MY')).toBe('+60123456789')
      expect(normalizePhoneE164('011-1234 5678', 'MY')).toBe('+601112345678')
    })
  })

  describe('isValidPhoneByCountry', () => {
    it('validates Indonesian numbers properly', () => {
      expect(isValidPhoneByCountry('081234567890', 'ID')).toBe(true)
      expect(isValidPhoneByCountry('+6281234567890', 'ID')).toBe(true)
      expect(isValidPhoneByCountry('021123456', 'ID')).toBe(false)
    })

    it('validates Malaysian numbers properly', () => {
      expect(isValidPhoneByCountry('0123456789', 'MY')).toBe(true)
      expect(isValidPhoneByCountry('+60123456789', 'MY')).toBe(true)
      expect(isValidPhoneByCountry('0377221234', 'MY')).toBe(true) // KL landline
      expect(isValidPhoneByCountry('123', 'MY')).toBe(false)
    })
  })

  describe('validateMalaysiaWestPostalCode', () => {
    it('accepts valid Peninsular Malaysia postal codes (01000 - 86999)', () => {
      expect(validateMalaysiaWestPostalCode('50450')).toEqual({ valid: true }) // KL
      expect(validateMalaysiaWestPostalCode('40100')).toEqual({ valid: true }) // Shah Alam
      expect(validateMalaysiaWestPostalCode('80000')).toEqual({ valid: true }) // Johor Bahru
      expect(validateMalaysiaWestPostalCode('01000')).toEqual({ valid: true }) // Kangar, Perlis
    })

    it('rejects East Malaysia postal codes (87000 - 98999)', () => {
      expect(validateMalaysiaWestPostalCode('87000')).toEqual({
        valid: false,
        reason: 'east_malaysia',
      }) // Labuan
      expect(validateMalaysiaWestPostalCode('88000')).toEqual({
        valid: false,
        reason: 'east_malaysia',
      }) // Kota Kinabalu, Sabah
      expect(validateMalaysiaWestPostalCode('93000')).toEqual({
        valid: false,
        reason: 'east_malaysia',
      }) // Kuching, Sarawak
    })

    it('rejects invalid postal code format', () => {
      expect(validateMalaysiaWestPostalCode('4010')).toEqual({
        valid: false,
        reason: 'format',
      })
      expect(validateMalaysiaWestPostalCode('ABCDE')).toEqual({
        valid: false,
        reason: 'format',
      })
    })
  })

  describe('hasPoBoxAddress', () => {
    it('detects P.O. Box variants', () => {
      expect(hasPoBoxAddress('P.O. Box 1234, Bukit Bintang')).toBe(true)
      expect(hasPoBoxAddress('PO BOX 99')).toBe(true)
      expect(hasPoBoxAddress('Peti Surat 45, Pos Laju')).toBe(true)
      expect(hasPoBoxAddress('Locked Bag 101')).toBe(true)
      expect(hasPoBoxAddress('Karung Berkunci 22')).toBe(true)
    })

    it('allows valid standard addresses', () => {
      expect(hasPoBoxAddress('No. 12 Jalan Telawi 3, Bangsar')).toBe(false)
      expect(hasPoBoxAddress('Apartment Seri Mawar Blok B-3-4')).toBe(false)
    })
  })

  describe('formatApproxMYR', () => {
    it('formats MYR approximation cleanly', () => {
      expect(formatApproxMYR(360000, 3600)).toBe('≈ RM 100.00')
      expect(formatApproxMYR(180000, 3600)).toBe('≈ RM 50.00')
      expect(formatApproxMYR(0, 3600)).toBe('≈ RM 0.00')
    })
  })

  describe('buildWhatsAppUrl', () => {
    it('builds WhatsApp URL with correct country code', () => {
      expect(buildWhatsAppUrl('081234567890', undefined, 'ID')).toBe('https://wa.me/6281234567890')
      expect(buildWhatsAppUrl('0123456789', undefined, 'MY')).toBe('https://wa.me/60123456789')
      expect(buildWhatsAppUrl('+60123456789', 'Halo')).toBe('https://wa.me/60123456789?text=Halo')
    })
  })

  describe('shipping utilities', () => {
    it('maps international and domestic courier labels', () => {
      expect(getCourierLabel('ninja_express_my')).toBe('Ninja Van MY')
      expect(getCourierLabel('lion_interpack')).toBe('Lion Parcel INTERPACK')
      expect(getCourierLabel('jne_reg')).toBe('JNE Express')
    })

    it('generates tracking URLs', () => {
      expect(getCourierTrackingUrl('Ninja Van MY', 'NVMY123456')).toBe(
        'https://www.ninjavan.co/en-my/tracking?id=NVMY123456'
      )
      expect(getCourierTrackingUrl('Lion Parcel INTERPACK', 'LP987654')).toBe(
        'https://lionparcel.com/track/stt?q=LP987654'
      )
      expect(getCourierTrackingUrl('Unknown Courier', 'TRK999')).toBe(
        'https://t.17track.net/en#nums=TRK999'
      )
    })

    it('parses multiple tracking numbers', () => {
      expect(parseTrackingNumbers('NVMY123, NVMY124; NVMY125\nNVMY126')).toEqual([
        'NVMY123',
        'NVMY124',
        'NVMY125',
        'NVMY126',
      ])
      expect(parseTrackingNumbers(null)).toEqual([])
    })
  })

  describe('Malaysian fashion synonyms search (scoreProduct)', () => {
    it('matches "seluar" against Indonesian "Celana"', () => {
      const product = { id: '1', name: 'Celana Kulot Linen' }
      const score = scoreProduct(product, 'seluar')
      expect(score).toBeGreaterThan(0)
    })

    it('matches "palazzo" against "Kulot"', () => {
      const product = { id: '2', name: 'Kulot Highwaist' }
      const score = scoreProduct(product, 'palazzo')
      expect(score).toBeGreaterThan(0)
    })

    it('matches "slack" against "Celana"', () => {
      const product = { id: '3', name: 'Celana Formal Ankle' }
      const score = scoreProduct(product, 'slack')
      expect(score).toBeGreaterThan(0)
    })

    it('normalizes multi-word "baju t" to match "Kaos"', () => {
      const product = { id: '4', name: 'Kaos Polos Cotton Combed' }
      const score = scoreProduct(product, 'baju t')
      expect(score).toBeGreaterThan(0)
    })

    it('normalizes multi-word "tali pinggang" to match "Sabuk / Obi"', () => {
      const product = { id: '5', name: 'Obi Belt Pita Linen' }
      const score = scoreProduct(product, 'tali pinggang')
      expect(score).toBeGreaterThan(0)
    })

    it('matches "bengkung" against "Obi / Sabuk"', () => {
      const product = { id: '6', name: 'Obi Belt Batik' }
      const score = scoreProduct(product, 'bengkung')
      expect(score).toBeGreaterThan(0)
    })

    it('matches "tunik" against "Blouse"', () => {
      const product = { id: '7', name: 'Blouse Tunik Rayon' }
      const score = scoreProduct(product, 'tunik')
      expect(score).toBeGreaterThan(0)
    })

    it('matches "kurung" against "Setelan"', () => {
      const product = { id: '8', name: 'Setelan Gamis Flowy' }
      const score = scoreProduct(product, 'kurung')
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('useMarketStore state & hydration', () => {
    it('switches market between ID and MY and sets isHydrated via syncFromCookie', () => {
      const store = useMarketStore.getState()
      expect(store.market).toBe('ID')

      store.setMarket('MY')
      expect(useMarketStore.getState().market).toBe('MY')

      store.syncFromCookie()
      expect(useMarketStore.getState().isHydrated).toBe(true)

      store.setMarket('ID')
      expect(useMarketStore.getState().market).toBe('ID')
    })
  })
})
