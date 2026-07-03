import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import * as repo from '../infrastructure/product.repository'
import { ProductFilters } from '@/entities/product/model/product.types'
import { ProductPayload } from '@/entities/product/model/product.types'

export class ProductService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProducts(filters: ProductFilters = {}) {
    return repo.getProducts(this.supabase, filters)
  }

  async getProductBySlug(slug: string) {
    return repo.getProductBySlug(this.supabase, slug)
  }

  async getRelatedProducts(productId: string, categoryId: string, limit = 4) {
    return repo.getRelatedProducts(this.supabase, productId, categoryId, limit)
  }

  async adminGetProducts(params: { page?: number; limit?: number; search?: string } = {}) {
    return repo.adminGetProducts(this.supabase, params)
  }

  async adminCreateProduct(
    productData: ProductPayload['productData'],
    variants: ProductPayload['variants'],
    images: ProductPayload['images'],
    marketplaceLinks: ProductPayload['links'],
    collectionIds: string[] = []
  ) {
    return repo.adminCreateProduct(
      this.supabase,
      productData,
      variants,
      images,
      marketplaceLinks,
      collectionIds
    )
  }

  async adminUpdateProduct(
    productId: string,
    productData: ProductPayload['productData'],
    variants: ProductPayload['variants'],
    images: ProductPayload['images'],
    marketplaceLinks: ProductPayload['links'],
    collectionIds: string[] = []
  ) {
    return repo.adminUpdateProduct(
      this.supabase,
      productId,
      productData,
      variants,
      images,
      marketplaceLinks,
      collectionIds
    )
  }

  async adminDeleteProduct(productId: string) {
    return repo.adminDeleteProduct(this.supabase, productId)
  }
}
