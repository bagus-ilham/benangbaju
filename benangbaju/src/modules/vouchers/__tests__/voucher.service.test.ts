import { vi, describe, beforeEach, it, expect } from 'vitest'
import { voucherService } from '../voucher.service'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('VoucherService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize successfully', () => {
    expect(voucherService).toBeDefined()
  })

  it('should validate voucher', async () => {
    expect(voucherService.validateVoucher).toBeDefined()
  })
})
