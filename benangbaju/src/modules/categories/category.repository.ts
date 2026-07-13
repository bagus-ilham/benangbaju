import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import type { Category } from './types'

export class CategoryRepository {
  async getActiveCategories(): Promise<ApiListResponse<Category>> {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      safeLogError('Error fetching categories:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar kategori')
    }

    return paginated(data || [])
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category | null>> {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      safeLogError(`Error fetching category for slug ${slug}:`, error)
      return fail(ApiErrorCode.NOT_FOUND, 'Kategori tidak ditemukan')
    }

    return ok(data)
  }

  async adminGetCategories(): Promise<ApiListResponse<Category>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
      .order('sort_order', { ascending: true })

    if (error) {
      safeLogError('Error fetching categories:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat daftar kategori')
    }

    return paginated(data || [])
  }

  async adminCreateCategory(categoryData: {
    parent_id: string | null
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
  }): Promise<ApiResponse<Category>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
      .single()

    if (error) {
      safeLogError('Error in adminCreateCategory:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat kategori')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'category',
      data.id,
      `Created category ${categoryData.name}`
    )

    return ok(data)
  }

  async adminUpdateCategory(
    categoryId: string,
    categoryData: {
      parent_id: string | null
      name: string
      slug: string
      description: string | null
      image_url: string | null
      sort_order: number
      is_active: boolean
    }
  ): Promise<ApiResponse<Category>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', categoryId)
      .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
      .single()

    if (error) {
      safeLogError('Error in adminUpdateCategory:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui kategori')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'category',
      categoryId,
      `Updated category ${categoryData.name}`
    )

    return ok(data)
  }

  async adminDeleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    
    // Pre-check for subcategories
    const { count: subcategoriesCount, error: subError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', categoryId)

    if (subError) {
      safeLogError('Error checking subcategories:', subError)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengecek sub-kategori')
    }

    if (subcategoriesCount && subcategoriesCount > 0) {
      return fail(ApiErrorCode.VALIDATION_ERROR, 'Kategori tidak bisa dihapus karena masih memiliki sub-kategori')
    }

    // Pre-check for products
    const { count: productsCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (prodError) {
      safeLogError('Error checking products:', prodError)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengecek produk')
    }

    if (productsCount && productsCount > 0) {
      return fail(ApiErrorCode.VALIDATION_ERROR, 'Kategori tidak bisa dihapus karena masih ada produk di dalamnya')
    }

    // 1. Fetch images associated with this category to clean up storage
    const { data: category } = await supabase
      .from('categories')
      .select('image_url')
      .eq('id', categoryId)
      .single()

    // 2. Delete the physical image from Supabase Storage
    if (category && category.image_url) {
      try {
        const { deleteImageByUrl } = await import('@/lib/supabase/storage')
        await deleteImageByUrl(supabase, category.image_url, 'categories')
      } catch (err) {
        safeLogError('Failed to delete category image, proceeding with DB deletion:', err)
      }
    }

    // 3. Delete category record
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)

    if (error) {
      safeLogError('Error in adminDeleteCategory:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus kategori')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'category',
      categoryId,
      `Deleted category ${categoryId}`
    )

    return ok()
  }
}

export const categoryRepository = new CategoryRepository()
