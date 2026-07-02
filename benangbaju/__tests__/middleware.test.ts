import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

// We need to reset the module to clear the rateLimitMap between tests,
// or we can just mock Date.now() to expire things.
// In vitest, vi.useFakeTimers() + vi.setSystemTime() is great for this.

describe('Middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2020, 1, 1, 0, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createRequest = (path: string, ip: string, apiKey?: string) => {
    const headers = new Headers()
    headers.set('x-forwarded-for', ip)
    if (apiKey) {
      headers.set('x-api-key', apiKey)
    }
    
    return new NextRequest(new URL(`http://localhost${path}`), { headers })
  }

  describe('Auth routes rate limiting', () => {
    it('allows requests within limit', () => {
      const req = createRequest('/masuk', '127.0.0.1')
      const res = middleware(req)
      
      // Should return next() which is generally an empty response or specific headers in Next.js
      expect(res.status).toBe(200) // NextResponse.next() defaults to 200 without body
    })

    it('blocks requests over limit and returns 429 page', () => {
      const ip = '192.168.1.1'
      
      // Make 5 requests
      for(let i=0; i<5; i++) {
        middleware(createRequest('/masuk', ip))
      }

      // 6th request should fail
      const res = middleware(createRequest('/masuk', ip))
      expect(res.status).toBe(429)
      expect(res.headers.get('Retry-After')).toBe('60')
    })
  })

  describe('API v1 routes rate limiting & Auth', () => {
    const originalEnv = process.env.ERP_API_KEY

    beforeEach(() => {
      process.env.ERP_API_KEY = 'valid-test-key'
    })

    afterEach(() => {
      process.env.ERP_API_KEY = originalEnv
    })

    it('allows API requests within rate limit', () => {
      const req = createRequest('/api/v1/products', '10.0.0.1')
      const res = middleware(req)
      expect(res.status).toBe(200)
    })

    it('blocks API requests over limit', async () => {
      const ip = '10.0.0.2'
      for(let i=0; i<60; i++) {
        middleware(createRequest('/api/v1/products', ip))
      }
      
      const res = middleware(createRequest('/api/v1/products', ip))
      expect(res.status).toBe(429)
      
      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan' }
      })
    })

    it('rejects /api/v1/inventory/sync without API key', async () => {
      const req = createRequest('/api/v1/inventory/sync', '10.0.0.3')
      const res = middleware(req)
      
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('allows /api/v1/inventory/sync with valid API key', () => {
      const req = createRequest('/api/v1/inventory/sync', '10.0.0.4', 'valid-test-key')
      const res = middleware(req)
      expect(res.status).toBe(200)
    })
    
    it('expires rate limits correctly', () => {
      const ip = '10.0.0.5'
      for(let i=0; i<60; i++) {
        middleware(createRequest('/api/v1/products', ip))
      }
      
      // Fast forward 61 seconds
      vi.advanceTimersByTime(61000)
      
      const res = middleware(createRequest('/api/v1/products', ip))
      expect(res.status).toBe(200) // Should be allowed again
    })
  })
})
