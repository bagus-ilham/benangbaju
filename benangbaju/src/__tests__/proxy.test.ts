import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../proxy'

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextRequest: vi.fn(),
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
      next: vi.fn(() => ({ type: 'next', headers: new Headers() })),
    },
  }
})

describe('proxy middleware', () => {
  it('should allow API requests without API key if not ERP', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test'

    const req = {
      nextUrl: { pathname: '/api/v1/products', clone: () => ({ searchParams: { set: vi.fn() } }) },
      headers: new Headers(),
      cookies: { getAll: vi.fn().mockReturnValue([]) },
    } as any

    const res = await proxy(req)
    expect(res.type).toBe('next')
  })
})
