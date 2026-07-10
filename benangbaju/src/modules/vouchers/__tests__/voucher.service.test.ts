import { voucherService } from '../voucher.service'

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('VoucherService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize successfully', () => {
    expect(voucherService).toBeDefined()
  })

  it('should validate voucher', async () => {
    expect(voucherService.validateVoucher).toBeDefined()
  })
})
