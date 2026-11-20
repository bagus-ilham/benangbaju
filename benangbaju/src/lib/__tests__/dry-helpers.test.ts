import { describe, it, expect, afterEach } from 'vitest'
import {
  DEFAULT_MYR_EXCHANGE_RATE,
  parseMyrExchangeRate,
  isEastMalaysiaProvince,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_LABELS_BILINGUAL,
} from '@/lib/constants'
import { sanitizeJsonLd } from '@/lib/siteUrl'
import { constantTimeCompare, generateDokuSignature, getDokuApiUrl } from '@/lib/doku'

describe('DRY shared helpers', () => {
  describe('parseMyrExchangeRate', () => {
    it('returns valid positive numbers directly', () => {
      expect(parseMyrExchangeRate(3800)).toBe(3800)
      expect(parseMyrExchangeRate('3750.5')).toBe(3750.5)
    })

    it('falls back to DEFAULT_MYR_EXCHANGE_RATE on invalid or non-positive values', () => {
      expect(parseMyrExchangeRate(undefined)).toBe(DEFAULT_MYR_EXCHANGE_RATE)
      expect(parseMyrExchangeRate(null)).toBe(DEFAULT_MYR_EXCHANGE_RATE)
      expect(parseMyrExchangeRate('')).toBe(DEFAULT_MYR_EXCHANGE_RATE)
      expect(parseMyrExchangeRate('abc')).toBe(DEFAULT_MYR_EXCHANGE_RATE)
      expect(parseMyrExchangeRate(0)).toBe(DEFAULT_MYR_EXCHANGE_RATE)
      expect(parseMyrExchangeRate(-500)).toBe(DEFAULT_MYR_EXCHANGE_RATE)
    })
  })

  describe('isEastMalaysiaProvince', () => {
    it('detects Sabah, Sarawak, and Labuan case-insensitively', () => {
      expect(isEastMalaysiaProvince('Sabah')).toBe(true)
      expect(isEastMalaysiaProvince('SARAWAK')).toBe(true)
      expect(isEastMalaysiaProvince('Wilayah Persekutuan Labuan')).toBe(true)
    })

    it('returns false for Peninsular Malaysia, Indonesian provinces, and empty values', () => {
      expect(isEastMalaysiaProvince('Selangor')).toBe(false)
      expect(isEastMalaysiaProvince('DKI Jakarta')).toBe(false)
      expect(isEastMalaysiaProvince('')).toBe(false)
      expect(isEastMalaysiaProvince(null)).toBe(false)
    })
  })

  describe('ORDER_STATUS_LABELS single source of truth', () => {
    it('derives Indonesian labels from bilingual source', () => {
      expect(ORDER_STATUS_LABELS.pending_payment).toBe(
        ORDER_STATUS_LABELS_BILINGUAL.pending_payment.id
      )
      expect(ORDER_STATUS_LABELS.completed).toBe(ORDER_STATUS_LABELS_BILINGUAL.completed.id)
    })
  })

  describe('sanitizeJsonLd', () => {
    it('escapes HTML angle brackets to prevent script tag breakout', () => {
      const json = sanitizeJsonLd({ name: '</script><script>alert(1)</script>' })
      expect(json).not.toContain('<')
      expect(json).not.toContain('>')
      expect(json).toContain('\\u003c/script\\u003e')
    })
  })

  describe('DOKU helpers', () => {
    const originalEnv = { ...process.env }

    afterEach(() => {
      process.env = { ...originalEnv }
    })

    it('constantTimeCompare matches equal strings and rejects mismatched strings/lengths', () => {
      expect(constantTimeCompare('HMACSHA256=abc123', 'HMACSHA256=abc123')).toBe(true)
      expect(constantTimeCompare('HMACSHA256=abc123', 'HMACSHA256=abc124')).toBe(false)
      expect(constantTimeCompare('short', 'much-longer')).toBe(false)
    })

    it('getDokuApiUrl resolves sandbox, production, and explicit override URLs', () => {
      delete process.env.DOKU_API_URL
      delete process.env.DOKU_ENVIRONMENT
      delete process.env.ENVIRONMENT
      expect(getDokuApiUrl()).toBe('https://api-sandbox.doku.com')

      process.env.DOKU_ENVIRONMENT = 'production'
      expect(getDokuApiUrl()).toBe('https://api.doku.com')

      process.env.DOKU_API_URL = 'https://custom.doku.example/'
      expect(getDokuApiUrl()).toBe('https://custom.doku.example')
    })

    it('generateDokuSignature produces deterministic HMACSHA256 signatures with and without body', () => {
      const baseParams = {
        clientId: 'BRN-TEST',
        requestId: 'req-001',
        requestTimestamp: '2026-11-20T09:00:00Z',
        requestTarget: '/orders/v1/status/INV-001',
        secretKey: 'SK-TEST-SECRET',
      }

      const sigNoBody = generateDokuSignature(baseParams)
      const sigWithBody = generateDokuSignature({
        ...baseParams,
        rawBody: JSON.stringify({ invoice: 'INV-001' }),
      })

      expect(sigNoBody.startsWith('HMACSHA256=')).toBe(true)
      expect(sigWithBody.startsWith('HMACSHA256=')).toBe(true)
      expect(sigNoBody).not.toBe(sigWithBody)
      expect(generateDokuSignature(baseParams)).toBe(sigNoBody)
    })
  })
})
