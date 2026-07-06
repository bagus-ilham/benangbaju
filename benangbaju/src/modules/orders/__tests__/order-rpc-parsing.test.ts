import { describe, it, expect, vi } from 'vitest'
import { createOrder } from '../services'

// Mock SupabaseClient
const mockSupabase = {
  rpc: vi.fn(),
} as any

describe('Order Repository - createOrder RPC parsing', () => {
  const dummyParams = {
    userId: 'user-1',
    addressId: 'addr-1',
    shippingCost: 10000,
    courierName: 'JNE',
  }

  it('handles error from Supabase RPC correctly', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database constraint failed' },
    })

    const res = await createOrder(mockSupabase, dummyParams)
    if (res.success) throw new Error('Expected failure')
    expect(res.success).toBe(false)
    expect(res.error.message).toBe('Gagal membuat pesanan. Silakan coba lagi.')
  })

  it('handles non-object data (e.g. string)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: 'not an object',
      error: null,
    })

    const res = await createOrder(mockSupabase, dummyParams)
    if (res.success) throw new Error('Expected failure')
    expect(res.success).toBe(false)
    expect(res.error.message).toBe('Format respon buat pesanan tidak valid.')
  })

  it('handles success: false returned by RPC', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { success: false, message: 'Stock empty' },
      error: null,
    })

    const res = await createOrder(mockSupabase, dummyParams)
    if (res.success) throw new Error('Expected failure')
    expect(res.success).toBe(false)
    expect(res.error.message).toBe('Stock empty')
  })

  it('handles missing inner data despite success: true', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { success: true, message: 'Order created' },
      error: null,
    })

    const res = await createOrder(mockSupabase, dummyParams)

    // According to the logic, if innerData is undefined, it passes it to ok(undefined).
    // Let's verify what the codebase actually does.
    // The code does: let innerData = undefined; if (isObject(rawInnerData)) {...}; return ok(innerData)
    expect(res.success).toBe(true)
    expect(res.data).toBeUndefined()
  })

  it('parses correctly formatted inner data', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          order_id: 'ord-123',
          order_number: 'ORD-123',
          subtotal: 100000,
          shipping_cost: 10000,
          discount_amount: 0,
          total_amount: 110000,
          status: 'pending_payment',
        },
      },
      error: null,
    })

    const res = await createOrder(mockSupabase, dummyParams)

    expect(res.success).toBe(true)
    expect(res.data).toEqual({
      order_id: 'ord-123',
      order_number: 'ORD-123',
      subtotal: 100000,
      shipping_cost: 10000,
      discount_amount: 0,
      total_amount: 110000,
      status: 'pending_payment',
    })
  })

  it('gracefully handles wrong types in inner data (type safety net)', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          order_id: null, // should default to ''
          subtotal: '100000', // string instead of number, should default to 0
          total_amount: undefined,
        },
      },
      error: null,
    })

    const res = await createOrder(mockSupabase, dummyParams)

    expect(res.success).toBe(true)
    expect(res.data).toEqual({
      order_id: '',
      order_number: '',
      subtotal: 0,
      shipping_cost: 0,
      discount_amount: 0,
      total_amount: 0,
      status: '',
    })
  })
})
