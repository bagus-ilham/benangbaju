import type { Category } from './types'
import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export async function getActiveCategories(
  supabase: SupabaseClient<Database>
): Promise<ApiListResponse<Category>> {
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

export async function getCategoryBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ApiResponse<Category | null>> {
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

export async function adminGetCategories(
  supabase: SupabaseClient<Database>
): Promise<ApiListResponse<Category>> {
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

export async function adminCreateCategory(
  supabase: SupabaseClient<Database>,
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
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .single()

  if (error) {
    safeLogError('Error in adminCreateCategory:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat kategori')
  }

  await insertAdminActivityLog(
    supabase,
    'create',
    'category',
    data.id,
    `Created category ${categoryData.name}`
  )

  return ok(data)
}

export async function adminUpdateCategory(
  supabase: SupabaseClient<Database>,
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

  await insertAdminActivityLog(
    supabase,
    'update',
    'category',
    categoryId,
    `Updated category ${categoryData.name}`
  )

  return ok(data)
}

export async function adminDeleteCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
): Promise<ApiResponse<void>> {
  // 1. Fetch images associated with this category to clean up storage
  const { data: category } = await supabase
    .from('categories')
    .select('image_url')
    .eq('id', categoryId)
    .single()

  // 2. Delete the physical image from Supabase Storage
  if (category && category.image_url) {
    const { deleteImageByUrl } = await import('@/lib/supabase/storage')
    await deleteImageByUrl(supabase, category.image_url, 'categories')
  }

  // 3. Delete category record
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) {
    safeLogError('Error in adminDeleteCategory:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus kategori')
  }

  await insertAdminActivityLog(
    supabase,
    'delete',
    'category',
    categoryId,
    `Deleted category ${categoryId}`
  )

  return ok()
}

export type { Category }

export * from './types'
