import { describe, it, expect } from 'vitest'
import { mapProductListItem } from '../product.mapper'

describe('Product Repository - mapProductListItem', () => {
  const baseProduct = {
    id: 'p-1',
    category_id: 'c-1',
    name: 'T-Shirt',
    slug: 't-shirt',
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    categories: { name: 'Tops', slug: 'tops' },
    product_variants: [],
    product_images: [],
  }

  it('calculates minPrice and maxPrice correctly', () => {
    const product = {
      ...baseProduct,
      product_variants: [
        { id: 'v-1', price: 150000, is_active: true },
        { id: 'v-2', price: 100000, is_active: true },
        { id: 'v-3', price: 200000, is_active: true },
        { id: 'v-4', price: 50000, is_active: false }, // Should be ignored
      ],
    }

    const result = mapProductListItem(product)

    expect(result.minPrice).toBe(100000)
    expect(result.maxPrice).toBe(200000)
  })

  it('calculates discountPercent correctly based on minPrice', () => {
    const product = {
      ...baseProduct,
      product_variants: [
        { id: 'v-1', price: 100000, compare_price: 200000, is_active: true },
        { id: 'v-2', price: 150000, compare_price: 250000, is_active: true },
      ],
    }

    const result = mapProductListItem(product)

    // minPrice is 100,000. compare_price for v-1 is 200,000
    // discount = (200,000 - 100,000) / 200,000 = 50%
    expect(result.discountPercent).toBe(50)
  })

  it('handles empty variants gracefully (returns 0 and nulls)', () => {
    const product = {
      ...baseProduct,
      product_variants: [],
    }

    const result = mapProductListItem(product)

    expect(result.minPrice).toBe(0)
    expect(result.maxPrice).toBe(0)
    expect(result.comparePrice).toBeNull()
    expect(result.discountPercent).toBeNull()
  })

  it('selects correct primary and hover images', () => {
    const product = {
      ...baseProduct,
      product_images: [
        { url: 'img-3.jpg', sort_order: 3, is_primary: false },
        { url: 'img-1.jpg', sort_order: 1, is_primary: true },
        { url: 'img-2.jpg', sort_order: 2, is_primary: false },
      ],
    }

    const result = mapProductListItem(product)

    // Primary is explicit
    expect(result.primaryImage).toBe('img-1.jpg')
    // Hover should be the first non-primary image with sort_order > 0
    // After mapImages sorting, it's img-2.jpg
    expect(result.hoverImage).toBe('img-2.jpg')
  })

  it('detects multiple colors correctly', () => {
    const product = {
      ...baseProduct,
      product_variants: [
        {
          is_active: true,
          product_variant_attrs: [{ attr_name: 'Warna', attr_value: 'Merah' }],
        },
        {
          is_active: true,
          product_variant_attrs: [{ attr_name: 'Warna', attr_value: 'Biru' }],
        },
      ],
    }

    const result = mapProductListItem(product)
    expect(result.hasMultipleColors).toBe(true)
  })

  it('detects single color correctly', () => {
    const product = {
      ...baseProduct,
      product_variants: [
        {
          is_active: true,
          product_variant_attrs: [{ attr_name: 'Warna', attr_value: 'Merah' }],
        },
        {
          is_active: true,
          product_variant_attrs: [{ attr_name: 'Warna', attr_value: 'Merah' }],
        },
      ],
    }

    const result = mapProductListItem(product)
    expect(result.hasMultipleColors).toBe(false)
  })

  it('marks product as unavailable in MY when no active variant has price_myr > 0', () => {
    const product = {
      ...baseProduct,
      product_variants: [
        { id: 'v-1', price: 250000, price_myr: null, stock: 10, stock_my: 5, is_active: true },
        { id: 'v-2', price: 260000, price_myr: 0, stock: 5, stock_my: 2, is_active: true },
      ],
    }

    const result = mapProductListItem(product)
    expect(result.isAvailableInMY).toBe(false)
    expect(result.minPriceMyr).toBeNull()
    expect(result.maxPriceMyr).toBeNull()
  })

  it('computes manual MYR min/max prices, discountPercentMyr, and preserves isolated stock_my', () => {
    const product = {
      ...baseProduct,
      product_variants: [
        {
          id: 'v-1',
          price: 250000,
          price_myr: 89.9,
          compare_price_myr: 119.9,
          stock: 20,
          stock_my: 4,
          is_active: true,
        },
        {
          id: 'v-2',
          price: 280000,
          price_myr: 99.9,
          compare_price_myr: null,
          stock: 15,
          stock_my: 0,
          is_active: true,
        },
        {
          id: 'v-3',
          price: 150000,
          price_myr: 49.0,
          stock: 5,
          stock_my: 3,
          is_active: false, // inactive should be ignored
        },
      ],
    }

    const result = mapProductListItem(product)
    expect(result.isAvailableInMY).toBe(true)
    expect(result.minPriceMyr).toBe(89.9)
    expect(result.maxPriceMyr).toBe(99.9)
    expect(result.comparePriceMyr).toBe(119.9)
    expect(result.discountPercentMyr).toBe(25)
    expect(result.product_variants[0].stock).toBe(20)
    expect(result.product_variants[0].stock_my).toBe(4)
  })
})
