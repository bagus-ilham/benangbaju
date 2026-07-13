import { describe, it, expect } from 'vitest'
import { ok, fail, paginated } from '@/lib/api-response'
import { ApiError, ApiErrorCode, ValidationError } from '@/lib/api-errors'

describe('api-response helpers', () => {
  describe('ok()', () => {
    it('returns success: true with no data', () => {
      const res = ok()
      expect(res).toEqual({ success: true })
    })

    it('returns success: true with data', () => {
      const res = ok({ id: 1 })
      expect(res).toEqual({ success: true, data: { id: 1 } })
    })
  })

  describe('fail()', () => {
    it('handles ApiError instance', () => {
      const error = new ApiError(ApiErrorCode.UNAUTHORIZED, 'Not logged in')
      const res = fail(error)
      expect(res).toEqual({
        success: false,
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Not logged in',
        },
      })
    })

    it('handles ValidationError instance with details', () => {
      const error = new ValidationError('Bad request', { field1: ['Required'] })
      const res = fail(error)
      expect(res).toEqual({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Bad request',
          details: { field1: ['Required'] },
        },
      })
    })

    it('handles string code and message', () => {
      const res = fail('CUSTOM_CODE', 'Custom message', { param: ['invalid'] })
      expect(res).toEqual({
        success: false,
        error: {
          code: 'CUSTOM_CODE',
          message: 'Custom message',
          details: { param: ['invalid'] },
        },
      })
    })

    it('handles native Error instance', () => {
      const error = new Error('Database connection failed')
      const res = fail(error)
      expect(res).toEqual({
        success: false,
        error: {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: 'Database connection failed',
        },
      })
    })

    it('handles unknown error types', () => {
      const res = fail({ weird: 'object' })
      expect(res).toEqual({
        success: false,
        error: {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: 'Kesalahan sistem yang tidak terduga',
        },
      })
    })
  })

  describe('paginated()', () => {
    it('returns unpaginated list when pagination params are omitted', () => {
      const data = [{ id: 1 }]
      const res = paginated(data)
      expect(res).toEqual({
        success: true,
        data: [{ id: 1 }],
      })
    })

    it('calculates total_pages correctly', () => {
      const data = [{ id: 1 }]
      const res = paginated(data, 1, 10, 25)
      expect(res.pagination).toEqual({
        page: 1,
        limit: 10,
        total_count: 25,
        total_pages: 3,
      })
    })

    it('handles 0 total items gracefully', () => {
      const res = paginated([], 1, 10, 0)
      expect(res.pagination).toEqual({
        page: 1,
        limit: 10,
        total_count: 0,
        total_pages: 1, // Math.max(1, 0) logic
      })
    })

    it('handles division by zero (limit = 0) gracefully (infinity -> 1 or max)', () => {
      const res = paginated([{ id: 1 }], 1, 0, 10)
      // Math.ceil(10 / 10) is 1.
      // We expect it to not crash and return 1 due to safe fallback.
      expect(res.pagination?.total_pages).toBe(1)
    })
  })
})
