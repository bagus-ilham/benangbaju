import { describe, it, expect } from 'vitest'
import {
  validateMalaysiaPostalCode,
  validateMalaysiaStatePostalCodeMatch,
} from '@/lib/utils/validation'
import {
  generateCustomerInvoiceHtml,
  generateCommercialInvoiceHtml,
  type InvoiceOrderData,
} from '@/lib/utils/invoice-generator'

describe('Tahap 4 — Logistics, Policies & Document Generation', () => {
  describe('B2-6: validateMalaysiaPostalCode (Full Malaysia Coverage: 01000–98999)', () => {
    it('accepts valid Peninsular (West Malaysia) postal codes and flags isEastMalaysia as false', () => {
      const kl = validateMalaysiaPostalCode('50450')
      expect(kl).toEqual({ valid: true, isEastMalaysia: false })

      const selangor = validateMalaysiaPostalCode('40100')
      expect(selangor).toEqual({ valid: true, isEastMalaysia: false })

      const perlis = validateMalaysiaPostalCode('01000')
      expect(perlis).toEqual({ valid: true, isEastMalaysia: false })

      const johor = validateMalaysiaPostalCode('86900')
      expect(johor).toEqual({ valid: true, isEastMalaysia: false })
    })

    it('accepts valid East Malaysia postal codes (87000–98999) and flags isEastMalaysia as true', () => {
      const labuan = validateMalaysiaPostalCode('87000')
      expect(labuan).toEqual({ valid: true, isEastMalaysia: true })

      const sabah = validateMalaysiaPostalCode('88100')
      expect(sabah).toEqual({ valid: true, isEastMalaysia: true })

      const sarawak = validateMalaysiaPostalCode('93200')
      expect(sarawak).toEqual({ valid: true, isEastMalaysia: true })

      const sarawakBorder = validateMalaysiaPostalCode('98850')
      expect(sarawakBorder).toEqual({ valid: true, isEastMalaysia: true })
    })

    it('rejects invalid postcode formats and out-of-range codes', () => {
      expect(validateMalaysiaPostalCode('4010')).toEqual({ valid: false, reason: 'format' })
      expect(validateMalaysiaPostalCode('ABCDE')).toEqual({ valid: false, reason: 'format' })
      expect(validateMalaysiaPostalCode('99000')).toEqual({ valid: false, reason: 'format' })
      expect(validateMalaysiaPostalCode('00999')).toEqual({ valid: false, reason: 'format' })
    })
  })

  describe('B2-6: validateMalaysiaStatePostalCodeMatch (Anti-Bypass Cross-Validation)', () => {
    it('approves matching West Malaysia states with West Malaysia postcodes', () => {
      const result1 = validateMalaysiaStatePostalCodeMatch('Selangor', '40100')
      expect(result1.valid).toBe(true)
      expect(result1.region).toBe('WEST')

      const result2 = validateMalaysiaStatePostalCodeMatch(
        'Wilayah Persekutuan Kuala Lumpur',
        '50450'
      )
      expect(result2.valid).toBe(true)
      expect(result2.region).toBe('WEST')

      const result3 = validateMalaysiaStatePostalCodeMatch('Johor', '80000')
      expect(result3.valid).toBe(true)
      expect(result3.region).toBe('WEST')
    })

    it('approves matching East Malaysia states with correct sub-region postcodes', () => {
      // Labuan: 87000–87999
      const labuan = validateMalaysiaStatePostalCodeMatch(
        'Wilayah Persekutuan Labuan',
        '87010'
      )
      expect(labuan.valid).toBe(true)
      expect(labuan.region).toBe('EAST')

      // Sabah: 88000–91999
      const sabah = validateMalaysiaStatePostalCodeMatch('Sabah', '88100')
      expect(sabah.valid).toBe(true)
      expect(sabah.region).toBe('EAST')

      // Sarawak: 93000–98999
      const sarawak = validateMalaysiaStatePostalCodeMatch('Sarawak', '93200')
      expect(sarawak.valid).toBe(true)
      expect(sarawak.region).toBe('EAST')
    })

    it('blocks West Malaysia states when an East Malaysia postcode is submitted (anti-bypass)', () => {
      const bypass1 = validateMalaysiaStatePostalCodeMatch('Selangor', '88000')
      expect(bypass1.valid).toBe(false)
      expect(bypass1.region).toBe('WEST')
      expect(bypass1.errorMessage).toContain('Malaysia Timur')

      const bypass2 = validateMalaysiaStatePostalCodeMatch('Johor', '93000')
      expect(bypass2.valid).toBe(false)
      expect(bypass2.errorMessage).toContain('Malaysia Timur')
    })

    it('blocks East Malaysia states when a West Malaysia postcode is submitted', () => {
      const mismatch1 = validateMalaysiaStatePostalCodeMatch('Sabah', '50450')
      expect(mismatch1.valid).toBe(false)
      expect(mismatch1.region).toBe('EAST')
      expect(mismatch1.errorMessage).toContain('87000–98999')

      const mismatch2 = validateMalaysiaStatePostalCodeMatch('Sarawak', '40100')
      expect(mismatch2.valid).toBe(false)
      expect(mismatch2.region).toBe('EAST')
    })

    it('blocks East Malaysia sub-region mismatch (e.g. Sabah state with Labuan postcode)', () => {
      const mismatch = validateMalaysiaStatePostalCodeMatch('Sabah', '87000')
      expect(mismatch.valid).toBe(false)
      expect(mismatch.errorMessage).toContain('88000–91999')

      const mismatchSarawak = validateMalaysiaStatePostalCodeMatch('Sarawak', '88500')
      expect(mismatchSarawak.valid).toBe(false)
      expect(mismatchSarawak.errorMessage).toContain('93000–98999')
    })
  })

  describe('B2-11: Customer Invoice & Commercial Invoice Generation', () => {
    const mockMalaysiaOrder: InvoiceOrderData = {
      order_number: 'ORD-20261110-MY001',
      created_at: '2026-11-10T08:30:00Z',
      status: 'shipped',
      subtotal: 500000,
      shipping_cost: 125000,
      discount_amount: 50000,
      total_amount: 575000,
      country_code: 'MY',
      exchange_rate_at_order: 3600,
      markup_percent_at_order: 10,
      total_myr: 175.7,
      payment_channel: 'qris',
      order_shipping: {
        recipient_name: 'Nur Aisyah',
        phone: '+60123456789',
        full_address: 'No. 25, Jalan Telawi, Bangsar Baru',
        city_name: 'Kuala Lumpur',
        province_name: 'Wilayah Persekutuan Kuala Lumpur',
        postal_code: '59100',
        courier_name: 'Ninja Van International',
        tracking_number: 'NVMY12345678',
        country_code: 'MY',
      },
      order_items: [
        {
          product_name: 'Gamis Silk Premium',
          variant_name: 'Sage Green - L',
          quantity: 2,
          price: 250000,
          subtotal: 500000,
          unit_price_myr: 76.39,
          total_myr: 152.78,
          weight_gram: 450,
          hs_code: '6204.43.00',
        },
      ],
    }

    it('generates a bilingual/English Customer Invoice for Malaysia with R4 snapshots', () => {
      const html = generateCustomerInvoiceHtml(mockMalaysiaOrder)

      expect(html).toContain('TAX & PAYMENT RECEIPT')
      expect(html).toContain('ORD-20261110-MY001')
      expect(html).toContain('Nur Aisyah')
      expect(html).toContain('MALAYSIA')
      expect(html).toContain('RM')
      expect(html).toContain('76.39')
      expect(html).toContain('175.70')
      expect(html).toContain('Final Sale')
      expect(html).toContain('Midtrans QRIS')
    })

    it('generates an official Commercial Invoice for customs declaration with HS code and DDU terms', () => {
      const html = generateCommercialInvoiceHtml(mockMalaysiaOrder)

      expect(html).toContain('COMMERCIAL INVOICE — CUSTOMS DECLARATION')
      expect(html).toContain('BENANGBAJU (PT BENANG BAJU INDONESIA)')
      expect(html).toContain('EXPORTER / SHIPPER')
      expect(html).toContain('CONSIGNEE / IMPORTER')
      expect(html).toContain('Nur Aisyah')
      expect(html).toContain('6204.43.00')
      expect(html).toContain('DAP / DDU (Delivered Duty Unpaid)')
      expect(html).toContain('NVMY12345678')
      expect(html).toContain('EXPORTER DECLARATION')
      expect(html).toContain('Total Net Weight')
    })
  })
})

