import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from './adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type Category = Database['public']['Tables']['categories']['Row']

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
    safeLogError('Error in adminGetCategories:', error)
    throw error
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
) : Promise<{ id: string; parent_id: string | null; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number; is_active: boolean; }> {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .single()

  if (error) throw error
  
  await insertAdminActivityLog(supabase, 'create', 'category', data.id, `Created category ${categoryData.name}`)
  
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
) : Promise<{ id: string; parent_id: string | null; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number; is_active: boolean; }> {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', categoryId)
    .select('id, parent_id, name, slug, description, image_url, sort_order, is_active')
    .single()

  if (error) throw error
  
  await insertAdminActivityLog(supabase, 'update', 'category', categoryId, `Updated category ${categoryData.name}`)
  
  return data
}

export async function adminDeleteCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
) : Promise<{ success: boolean; }> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
  
  await insertAdminActivityLog(supabase, 'delete', 'category', categoryId, `Deleted category ${categoryId}`)
  
  return { success: true }
}
