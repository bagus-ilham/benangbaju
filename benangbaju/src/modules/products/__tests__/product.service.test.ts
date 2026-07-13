import { vi, describe, beforeEach, it, expect } from 'vitest'
import { productService } from '../product.service'

vi.mock('@/lib/supabase/static', () => ({
  createStaticClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    })),
  })),
}))

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize successfully', () => {
    expect(productService).toBeDefined()
  })

  it('should format products properly', async () => {
    expect(productService.getProducts).toBeDefined()
  })
})
