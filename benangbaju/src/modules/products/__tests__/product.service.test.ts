import { vi, describe, beforeEach, it, expect } from 'vitest'
import { productService } from '../product.service'
import { productRepository } from '../product.repository'
import { flashSaleRepository } from '@/modules/flash-sales/flash-sale.repository'

vi.mock('@/lib/supabase/static', () => ({
  createStaticClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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

  it('isolates ID-only and MY-only flash sale overlays per market currency', async () => {
    vi.spyOn(productRepository, 'findOneBySlug').mockResolvedValueOnce({
      id: 'prod-2',
      category_id: 'cat-1',
      name: 'Gamis Silk',
      slug: 'gamis-silk',
      description: 'Desc',
      short_description: 'Short',
      description_en: null,
      short_description_en: null,
      care_guide: null,
      care_guide_en: null,
      meta_title: null,
      meta_description: null,
      weight_gram: 400,
      is_featured: false,
      created_at: '2026-11-01T00:00:00Z',
      size_guide: null,
      size_guide_inch: null,
      hs_code: null,
      categories: { name: 'Gamis', slug: 'gamis' },
      product_variants: [
        {
          id: 'var-1',
          sku: 'GS-M',
          name: 'M',
          price: 300000,
          compare_price: null,
          price_myr: 95,
          compare_price_myr: null,
          stock: 10,
          stock_my: 8,
          weight_gram: 400,
          is_active: true,
        },
      ],
      product_images: [],
      product_marketplace_links: [],
      product_rating_summary: [],
    } as any)

    vi.spyOn(flashSaleRepository, 'getActiveFlashSales').mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'fs-id',
          name: 'ID Only Sale',
          banner_url: null,
          starts_at: '2026-11-01T00:00:00Z',
          ends_at: '2026-12-01T00:00:00Z',
          is_active: true,
          target_market: 'ID',
          flash_sale_items: [
            {
              id: 'fsi-id',
              variant_id: 'var-1',
              sale_price: 200000,
              original_price: 300000,
              sale_price_myr: 50,
              original_price_myr: 95,
              quota: 10,
              sold_count: 2,
            },
          ],
        },
      ],
    } as any)

    const res = await productService.getProductBySlug('gamis-silk')
    expect(res.success).toBe(true)
    if (res.success && res.data) {
      const v = res.data.product_variants[0]
      // ID price gets discounted, MY price stays untouched because sale is ID-only
      expect(v.price).toBe(200000)
      expect(v.compare_price).toBe(300000)
      expect(v.price_myr).toBe(95)
      expect(v.compare_price_myr).toBeNull()
    }
  })
})
