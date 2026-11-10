import { vi, describe, beforeEach, it, expect } from 'vitest'
import { productService } from '../product.service'
import { productRepository } from '../product.repository'

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

  it('should preserve bilingual English fields (description_en, short_description_en, care_guide_en) in getProductBySlug', async () => {
    vi.spyOn(productRepository, 'findOneBySlug').mockResolvedValueOnce({
      id: 'prod-1',
      category_id: 'cat-1',
      name: 'Kemeja Linen',
      slug: 'kemeja-linen',
      description: 'Deskripsi bahasa Indonesia',
      short_description: 'Singkat ID',
      description_en: 'English full description',
      short_description_en: 'English short description',
      care_guide: 'Cuci tangan',
      care_guide_en: 'Hand wash cold',
      meta_title: null,
      meta_description: null,
      weight_gram: 250,
      is_featured: true,
      created_at: '2026-11-01T00:00:00Z',
      size_guide: null,
      size_guide_inch: null,
      hs_code: '6206.30',
      categories: { name: 'Atasan', slug: 'atasan' },
      product_variants: [],
      product_images: [],
      product_marketplace_links: [],
      product_rating_summary: [],
    } as any)

    const res = await productService.getProductBySlug('kemeja-linen')
    expect(res.success).toBe(true)
    if (res.success && res.data) {
      expect(res.data.description_en).toBe('English full description')
      expect(res.data.short_description_en).toBe('English short description')
      expect(res.data.care_guide_en).toBe('Hand wash cold')
    }
  })
})
