import { describe, it, expect, vi } from 'vitest'
import { validateVoucher } from '../infrastructure/voucher.repository'

const mockSupabase = {
  rpc: vi.fn(),
} as any

describe('Voucher Repository - validateVoucher RPC parsing', () => {
  it('handles database error correctly', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection timeout' },
    })

    const res = await validateVoucher(mockSupabase, 'PROMO10', 100000, 'user-1')

    expect(res.success).toBe(false)
    expect(res.valid).toBe(false)
    expect(res.message).toBe('Gagal memvalidasi voucher. Coba beberapa saat lagi.')
  })

  it('handles non-object response from RPC', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: ['invalid format'],
      error: null,
    })

    const res = await validateVoucher(mockSupabase, 'PROMO10', 100000, 'user-1')

    expect(res.success).toBe(false)
    expect(res.message).toBe('Format respon voucher tidak valid.')
  })

  it('parses valid voucher response perfectly', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        success: true,
        valid: true,
        voucher_id: 'v-123',
        code: 'PROMO10',
        discount_type: 'percentage',
        discount_amount: 10000,
        final_total: 90000,
      },
      error: null,
    })

    const res = await validateVoucher(mockSupabase, 'PROMO10', 100000, 'user-1')

    expect(res).toEqual({
      success: true,
      valid: true,
      voucher_id: 'v-123',
      code: 'PROMO10',
      discount_type: 'percentage',
      discount_amount: 10000,
      final_total: 90000,
      message: undefined,
      code_error: undefined,
    })
  })

  it('safely handles missing or wrong types by mapping to undefined', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        success: true,
        valid: true,
        discount_type: 'invalid_type', // Not fixed or percentage
        discount_amount: '10000', // String instead of number
      },
      error: null,
    })

    const res = await validateVoucher(mockSupabase, 'PROMO10', 100000, 'user-1')

    expect(res.discount_type).toBeUndefined()
    expect(res.discount_amount).toBeUndefined()
  })
})
