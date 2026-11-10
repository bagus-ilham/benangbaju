import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../proxy'

const mockCookiesSet = vi.fn()

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextRequest: vi.fn(),
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
      next: vi.fn(() => ({
        type: 'next',
        headers: new Headers(),
        cookies: {
          set: mockCookiesSet,
          get: vi.fn(),
        },
      })),
    },
  }
})

// Mock updateSession so it doesn't attempt real network queries to redirects table
vi.mock('@/lib/supabase/middleware', () => {
  return {
    updateSession: vi.fn(async () => {
      const { NextResponse } = await import('next/server')
      return NextResponse.next()
    }),
  }
})

describe('proxy middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookiesSet.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test'
  })

  it('should allow API requests without API key if not ERP', async () => {
    const req = {
      nextUrl: { pathname: '/api/v1/products', clone: () => ({ searchParams: { set: vi.fn() } }) },
      headers: new Headers(),
      cookies: { getAll: vi.fn().mockReturnValue([]) },
    } as unknown as NextRequest

    const res = await proxy(req)
    expect(res.type).toBe('next')
  })

  it('should auto-detect Malaysia visitor and set bb_market=MY cookie on first visit', async () => {
    const headers = new Headers()
    headers.set('x-vercel-ip-country', 'MY')

    const req = {
      nextUrl: { pathname: '/produk', clone: () => ({ searchParams: { set: vi.fn() } }) },
      headers,
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(undefined),
      },
    } as unknown as NextRequest

    const res = await proxy(req)
    expect(res.type).toBe('next')
    expect(mockCookiesSet).toHaveBeenCalledWith(
      'bb_market',
      'MY',
      expect.objectContaining({
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      })
    )
  })

  it('should not set bb_market cookie if existing bb_market cookie is already present', async () => {
    const headers = new Headers()
    headers.set('x-vercel-ip-country', 'MY')

    const req = {
      nextUrl: { pathname: '/produk', clone: () => ({ searchParams: { set: vi.fn() } }) },
      headers,
      cookies: {
        getAll: vi.fn().mockReturnValue([{ name: 'bb_market', value: 'ID' }]),
        get: vi.fn().mockReturnValue({ name: 'bb_market', value: 'ID' }),
      },
    } as unknown as NextRequest

    const res = await proxy(req)
    expect(res.type).toBe('next')
    expect(mockCookiesSet).not.toHaveBeenCalledWith(
      'bb_market',
      expect.anything(),
      expect.anything()
    )
  })

  it('should override and set bb_market cookie when ?market=MY query parameter is present', async () => {
    const searchParams = new URLSearchParams('market=my')
    const req = {
      nextUrl: {
        pathname: '/produk',
        searchParams,
        clone: () => ({ searchParams: { set: vi.fn() } }),
      },
      headers: new Headers(),
      cookies: {
        getAll: vi.fn().mockReturnValue([{ name: 'bb_market', value: 'ID' }]),
        get: vi.fn().mockReturnValue({ name: 'bb_market', value: 'ID' }),
      },
    } as unknown as NextRequest

    const res = await proxy(req)
    expect(res.type).toBe('next')
    expect(mockCookiesSet).toHaveBeenCalledWith(
      'bb_market',
      'MY',
      expect.objectContaining({
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      })
    )
  })

  it('should set bb_market=ID cookie when ?market=ID query parameter is present even if currently MY', async () => {
    const searchParams = new URLSearchParams('market=ID')
    const req = {
      nextUrl: {
        pathname: '/produk',
        searchParams,
        clone: () => ({ searchParams: { set: vi.fn() } }),
      },
      headers: new Headers(),
      cookies: {
        getAll: vi.fn().mockReturnValue([{ name: 'bb_market', value: 'MY' }]),
        get: vi.fn().mockReturnValue({ name: 'bb_market', value: 'MY' }),
      },
    } as unknown as NextRequest

    const res = await proxy(req)
    expect(res.type).toBe('next')
    expect(mockCookiesSet).toHaveBeenCalledWith(
      'bb_market',
      'ID',
      expect.objectContaining({
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      })
    )
  })

  it('should not set bb_market cookie if visitor country is not Malaysia', async () => {
    const headers = new Headers()
    headers.set('x-vercel-ip-country', 'ID')

    const req = {
      nextUrl: { pathname: '/produk', clone: () => ({ searchParams: { set: vi.fn() } }) },
      headers,
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(undefined),
      },
    } as unknown as NextRequest

    const res = await proxy(req)
    expect(res.type).toBe('next')
    expect(mockCookiesSet).not.toHaveBeenCalledWith(
      'bb_market',
      expect.anything(),
      expect.anything()
    )
  })
})
