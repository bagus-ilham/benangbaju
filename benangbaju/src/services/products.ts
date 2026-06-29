import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { ProductService } from '@/modules/product/application/product.service'
import * as types from '@/modules/product/domain/product.types'

export type { 
  ProductFilters, 
  ProductVariant, 
  ProductImage, 
  ProductMarketplaceLink, 
  ProductRatingSummary, 
  ProductListItem, 
  ProductDetailItem, 
  AdminProductListItem 
} from '@/modules/product/domain/product.types'

export async function getProducts(supabase: SupabaseClient<Database>, filters: types.ProductFilters = {}) {
  return new ProductService(supabase).getProducts(filters)
}

export async function getProductBySlug(supabase: SupabaseClient<Database>, slug: string) {
  return new ProductService(supabase).getProductBySlug(slug)
}

export async function getRelatedProducts(supabase: SupabaseClient<Database>, productId: string, categoryId: string, limit = 4) {
  return new ProductService(supabase).getRelatedProducts(productId, categoryId, limit)
}

export async function adminGetProducts(supabase: SupabaseClient<Database>, params: { page?: number; limit?: number; search?: string } = {}) {
  return new ProductService(supabase).adminGetProducts(params)
}

export async function adminCreateProduct(
  supabase: SupabaseClient<Database>, 
  productData: any, 
  variants: any, 
  images: any, 
  marketplaceLinks: any, 
  collectionIds: any = []
) {
  return new ProductService(supabase).adminCreateProduct(productData, variants, images, marketplaceLinks, collectionIds)
}

export async function adminUpdateProduct(
  supabase: SupabaseClient<Database>, 
  productId: string, 
  productData: any, 
  variants: any, 
  images: any, 
  marketplaceLinks: any, 
  collectionIds: any = []
) {
  return new ProductService(supabase).adminUpdateProduct(productId, productData, variants, images, marketplaceLinks, collectionIds)
}

export async function adminDeleteProduct(supabase: SupabaseClient<Database>, productId: string) {
  return new ProductService(supabase).adminDeleteProduct(productId)
}
