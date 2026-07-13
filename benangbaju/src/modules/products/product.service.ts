import { safeLogError } from '@/lib/logger'
import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

import { productRepository } from './product.repository'
import { mapCategory, mapVariants, mapImages, mapProductListItem } from './product.mapper'
import { parseOneToMany } from '@/shared/utils/supabase-parser'
import { ProductFilters, ProductListItem, ProductDetailItem } from './types'

export class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<ApiListResponse<ProductListItem>> {
    try {
      const { page = 1, limit = 20 } = filters
      const { data, count } = await productRepository.findMany(filters)

      if (!data) return paginated([], page, limit, 0)

      const results: ProductListItem[] = data.map(mapProductListItem)

      return paginated(results, page, limit, count || 0)
    } catch (error) {
      safeLogError('Error fetching products:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat produk')
    }
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<ProductDetailItem | null>> {
    try {
      const data = await productRepository.findOneBySlug(slug)

      if (!data) return ok(null)

      const categories = mapCategory(data.categories)
      const product_variants = mapVariants(data.product_variants)
      const sortedImages = mapImages(data.product_images)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linksList = parseOneToMany<any>(data.product_marketplace_links)
      const product_marketplace_links = linksList.map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
        label: link.label,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summaryList = parseOneToMany<any>(data.product_rating_summary)
      const firstSummary = summaryList[0] || null
      const product_rating_summary = firstSummary
        ? {
            avg_rating: firstSummary.avg_rating,
            total_reviews: firstSummary.total_reviews,
          }
        : null

      return ok({
        id: data.id,
        category_id: data.category_id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        short_description: data.short_description,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        weight_gram: data.weight_gram,
        is_featured: data.is_featured,
        created_at: data.created_at,
        categories,
        product_variants,
        product_images: sortedImages,
        product_marketplace_links,
        product_rating_summary,
        size_guide: data.size_guide,
        care_guide: data.care_guide,
      })
    } catch (error) {
      safeLogError(`Error fetching product details for slug ${slug}:`, error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat detail produk')
    }
  }

  async getRelatedProducts(
    productId: string,
    categoryId: string,
    limit = 4
  ): Promise<ApiListResponse<ProductListItem>> {
    try {
      const data = await productRepository.findRelated(productId, categoryId, limit)

      if (!data) return paginated([], 0, 1, limit)

      return paginated(data.map(mapProductListItem), data.length, 1, limit)
    } catch (error) {
      safeLogError('Error fetching related products:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat produk terkait')
    }
  }
}

export const productService = new ProductService()
