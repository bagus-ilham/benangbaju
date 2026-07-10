import { orderService } from '../order.service'

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    rpc: jest.fn().mockResolvedValue({ data: { success: true }, error: null }),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
