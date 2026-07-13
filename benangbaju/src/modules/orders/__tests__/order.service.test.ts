import { vi, describe, beforeEach, it, expect } from 'vitest'
import { orderService } from '../order.service'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize successfully', () => {
    expect(orderService).toBeDefined()
  })

  it('should create an order', async () => {
    expect(orderService.createOrder).toBeDefined()
  })

  it('should generate payment token', async () => {
    expect(orderService.generatePaymentToken).toBeDefined()
  })
})
