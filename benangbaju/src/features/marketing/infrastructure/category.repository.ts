import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/entities/adminLog/api/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { Category } from '../domain/category.types'
import { InternalError } from '@/lib/api-errors'

export async function getActiveCategories(supabase: SupabaseClient<Database>): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    safeLogError('Error fetching categories:', error)
    return []
  }

  return data || []
}

export async function getCategoryBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    safeLogError(`Error fetching category for slug ${slug}:`, error)
    return null
  }

  return data
}

export async function adminGetCategories(supabase: SupabaseClient<Database>): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .order('sort_order', { ascending: true })

  if (error) {
    throw new InternalError('Gagal memuat daftar kategori')
  }

  return data || []
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
): Promise<{
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}> {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .single()

  if (error) {
    safeLogError('Error in adminCreateCategory:', error)
    throw new InternalError('Gagal membuat kategori')
  }

  await insertAdminActivityLog(
    supabase,
    'create',
    'category',
    data.id,
    `Created category ${categoryData.name}`
  )

  return data
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
): Promise<{
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}> {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', categoryId)
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .single()

  if (error) {
    safeLogError('Error in adminUpdateCategory:', error)
    throw new InternalError('Gagal memperbarui kategori')
  }

  await insertAdminActivityLog(
    supabase,
    'update',
    'category',
    categoryId,
    `Updated category ${categoryData.name}`
  )

  return data
}

export async function adminDeleteCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
): Promise<{ success: boolean }> {
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
    throw new InternalError('Gagal menghapus kategori')
  }

  await insertAdminActivityLog(
    supabase,
    'delete',
    'category',
    categoryId,
    `Deleted category ${categoryId}`
  )

  return { success: true }
}
