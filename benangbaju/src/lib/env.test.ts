import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('validateEnv', () => {
  const originalEnv = process.env
  let originalConsoleError: typeof console.error

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    originalConsoleError = console.error
    console.error = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    console.error = originalConsoleError
    vi.clearAllMocks()
  })

  it('should not throw if all environment variables are present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key'
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY = 'client'
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL = 'url'
    process.env.NEXT_PUBLIC_APP_URL = 'app'

    const { validateEnv } = await import('./env')
    expect(() => validateEnv()).not.toThrow()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('should throw if any required environment variable is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key'
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY = 'client'
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL = 'url'
    delete process.env.NEXT_PUBLIC_APP_URL // Missing entirely

    // we must catch the error globally since validateEnv runs on module import (typeof window === 'undefined')
    await expect(import('./env')).rejects.toThrow(
      '❌ [Env Validation] Missing required environment variables:\n   - NEXT_PUBLIC_APP_URL\n\nPlease check your .env.local file.'
    )
    expect(console.error).toHaveBeenCalled()
  })

  it('should throw if any required environment variable is an empty string or whitespace', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '   ' // Whitespace
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key'
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY = 'client'
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL = 'url'
    process.env.NEXT_PUBLIC_APP_URL = 'app'

    await expect(import('./env')).rejects.toThrow(
      '❌ [Env Validation] Missing required environment variables:\n   - NEXT_PUBLIC_SUPABASE_URL\n\nPlease check your .env.local file.'
    )
    expect(console.error).toHaveBeenCalled()
  })

  it('should list multiple missing environment variables', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY = 'client'
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL = 'url'
    process.env.NEXT_PUBLIC_APP_URL = 'app'

    await expect(import('./env')).rejects.toThrow(
      '❌ [Env Validation] Missing required environment variables:\n   - NEXT_PUBLIC_SUPABASE_URL\n   - NEXT_PUBLIC_SUPABASE_ANON_KEY\n\nPlease check your .env.local file.'
    )
    expect(console.error).toHaveBeenCalled()
  })
})
