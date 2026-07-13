import { describe, it, expect, vi } from 'vitest'
import { createSecureOrderAction } from '../actions'

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: { cart_items: [] }, error: null }),
  single: vi.fn().mockResolvedValue({ data: { zone_id: '1' }, error: null }),
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  insert: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockReturnThis(),
}))

vi.mock('@/lib/auth-guard', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: '1' }, supabase: mockSupabase }),
  requireAdmin: vi.fn().mockResolvedValue({ user: { id: '1' }, supabase: mockSupabase }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue(mockSupabase),
}))

describe('createSecureOrderAction', () => {
  it('should reject empty cart', async () => {
    const res = await createSecureOrderAction({
      userId: '1',
      cartItems: [],
      totalAmount: 0,
      totalWeight: 0,
    } as any)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.message).toContain('Keranjang belanja kosong')
    }
  })
})
