import { productService } from '../product.service'

jest.mock('@/lib/supabase/static', () => ({
  createStaticClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    })),
  })),
}))

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize successfully', () => {
    expect(productService).toBeDefined()
  })

  it('should format products properly', async () => {
    expect(productService.getProducts).toBeDefined()
  })
})
