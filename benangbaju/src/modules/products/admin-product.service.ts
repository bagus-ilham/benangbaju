import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

import { productRepository } from './product.repository'
import { mapCategory, mapVariants } from './product.mapper'
import { AdminProductListItem, AdminVariantListItem, ProductPayload, UpdateVariantInput } from './types'

export class AdminProductService {
  async getProducts(
    params: { page?: number; limit?: number; search?: string } = {}
  ): Promise<ApiListResponse<AdminProductListItem>> {
    try {
      const { page = 1, limit = 20 } = params
      const { data, count } = await productRepository.adminFindMany(params)

      if (!data) return paginated([], page, limit, 0)

      const products: AdminProductListItem[] = data.map((p) => {
        const categories = mapCategory(p.categories)
        const product_variants = mapVariants(p.product_variants, false)

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          short_description: p.short_description,
          weight_gram: p.weight_gram,
          is_featured: p.is_featured,
          is_active: p.is_active,
          created_at: p.created_at,
          categories,
          product_variants,
        }
      })

      return paginated(products, page, limit, count || 0)
    } catch (error) {
      safeLogError('Error in adminGetProducts:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat daftar produk')
    }
  }

  async createProduct(
    productData: ProductPayload['productData'],
    variants: ProductPayload['variants'],
    images: ProductPayload['images'],
    marketplaceLinks: ProductPayload['links'],
    collectionIds: string[] = []
  ): Promise<ApiResponse<{ id: string }>> {
    try {
      const productId = await productRepository.adminCreate(
        productData,
        variants,
        images,
        marketplaceLinks,
        collectionIds
      )

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'create',
        'product',
        productId,
        `Created product ${productData.name}`
      )

      return ok({ id: productId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Gagal membuat produk', error)
      return fail('Gagal membuat produk', error.message || 'Transaction failed')
    }
  }

  async updateProduct(
    productId: string,
    productData: ProductPayload['productData'],
    variants: ProductPayload['variants'],
    images: ProductPayload['images'],
    marketplaceLinks: ProductPayload['links'],
    collectionIds: string[] = []
  ): Promise<ApiResponse<{ id: string }>> {
    try {
      // Variants
      const variantsToUpsert = variants.map((v) => ({
        ...v,
        id: !v.id || v.id.startsWith('temp-') ? null : v.id,
      }))
      const dbVariants = await productRepository.getProductVariants(productId)
      const dbVariantIds = (dbVariants || []).map((v) => v.id)
      const incomingVariantIds = variantsToUpsert.map((v) => v.id).filter((id) => id) as string[]
      const variantIdsToDelete = dbVariantIds.filter((id) => !incomingVariantIds.includes(id))

      // Images
      const imagesToUpsert = images.map((img) => ({
        ...img,
        id: !img.id || img.id.startsWith('temp-') ? null : img.id,
        variant_id:
          !img.variant_id || img.variant_id === '' || img.variant_id.startsWith('temp-')
            ? null
            : img.variant_id,
      }))
      const dbImages = await productRepository.getProductImages(productId)
      const dbImageIds = (dbImages || []).map((i) => i.id).filter(Boolean) as string[]
      const incomingImageIds = imagesToUpsert.map((i) => i.id).filter((id) => id) as string[]
      const imageIdsToDelete = dbImageIds.filter((id) => !incomingImageIds.includes(id))
      const deletedImageUrls = (dbImages || [])
        .filter((i) => imageIdsToDelete.includes(i.id))
        .map((i) => i.url)

      // Links
      const linksToUpsert = marketplaceLinks.map((link) => ({
        ...link,
        id: !link.id || link.id.startsWith('temp-') ? null : link.id,
      }))
      const dbLinks = await productRepository.getProductLinks(productId)
      const dbLinkIds = (dbLinks || []).map((l) => l.id).filter(Boolean) as string[]
      const incomingLinkIds = linksToUpsert.map((l) => l.id).filter((id) => id) as string[]
      const linkIdsToDelete = dbLinkIds.filter((id) => !incomingLinkIds.includes(id))

      await productRepository.adminUpdate(
        productId,
        productData,
        variantsToUpsert,
        variantIdsToDelete,
        imagesToUpsert,
        imageIdsToDelete,
        linksToUpsert,
        linkIdsToDelete,
        collectionIds
      )

      const supabase = await createServerClient()
      if (deletedImageUrls.length > 0) {
        const { deleteImageByUrl } = await import('@/lib/supabase/storage')
        await Promise.all(deletedImageUrls.map((url) => deleteImageByUrl(supabase, url, 'products')))
      }

      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'product',
        productId,
        `Updated product ${productData.name}`
      )

      return ok({ id: productId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Gagal memperbarui produk', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, error.message || 'Transaction failed')
    }
  }

  async deleteProduct(productId: string): Promise<ApiResponse<null>> {
    try {
      const images = await productRepository.getProductImages(productId)

      // Delete database record first
      await productRepository.adminDelete(productId)

      // If DB delete succeeds, clean up images from storage
      if (images && images.length > 0) {
        const supabase = await createServerClient()
        const { deleteImageByUrl } = await import('@/lib/supabase/storage')
        await Promise.all(images.map((img) => deleteImageByUrl(supabase, img.url, 'products')))
      }

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'delete',
        'product',
        productId,
        `Deleted product ${productId}`
      )

      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Delete error:', error)
      return fail('Gagal menghapus produk', error.message)
    }
  }

  async updateActiveStatus(productId: string, isActive: boolean): Promise<ApiResponse<null>> {
    try {
      await productRepository.adminUpdateActiveStatus(productId, isActive)
      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Update status error:', error)
      return fail('Gagal memperbarui status produk', error.message)
    }
  }

  async updateFeaturedStatus(productId: string, isFeatured: boolean): Promise<ApiResponse<null>> {
    try {
      await productRepository.adminUpdateFeaturedStatus(productId, isFeatured)
      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Update featured error:', error)
      return fail('Gagal memperbarui status featured', error.message)
    }
  }

  async getVariants(params: {
    page?: number
    limit?: number
    search?: string
    stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
    statusFilter?: 'all' | 'active' | 'inactive'
    sortBy?: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'
  } = {}): Promise<ApiListResponse<AdminVariantListItem>> {
    try {
      const { page = 1, limit = 20 } = params
      const { data, count } = await productRepository.adminFindManyVariants(params)

      if (!data) return paginated([], page, limit, 0)

      const variants: AdminVariantListItem[] = data.map((v) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prod = (v as any).products
        return {
          id: v.id,
          product_id: v.product_id,
          sku: v.sku,
          name: v.name,
          price: Number(v.price),
          compare_price: v.compare_price ? Number(v.compare_price) : null,
          stock: v.stock,
          is_active: v.is_active,
          product_name: prod?.name || 'Produk Tidak Ditemukan',
          product_slug: prod?.slug || '',
          category_name: prod?.categories?.name || null,
        }
      })

      return paginated(variants, page, limit, count || 0)
    } catch (error) {
      safeLogError('Error in adminGetVariants:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat daftar varian produk')
    }
  }

  async updateVariant(
    variantId: string,
    data: UpdateVariantInput
  ): Promise<ApiResponse<null>> {
    try {
      await productRepository.adminUpdateVariant(variantId, {
        price: data.price,
        compare_price: data.compare_price,
        stock: data.stock,
        is_active: data.is_active,
      })

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'product_variant',
        variantId,
        `Updated variant ${variantId} price=${data.price} stock=${data.stock}`
      )

      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Update variant error:', error)
      return fail('Gagal memperbarui varian produk', error.message)
    }
  }

  async batchUpdateVariants(
    updates: UpdateVariantInput[]
  ): Promise<ApiResponse<null>> {
    try {
      await productRepository.adminBatchUpdateVariants(updates)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'batch_update',
        'product_variant',
        null,
        `Batch updated ${updates.length} product variants`
      )

      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Batch update variants error:', error)
      return fail('Gagal memperbarui daftar varian produk', error.message)
    }
  }
}

export const adminProductService = new AdminProductService()
