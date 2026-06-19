import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type Category = Database['public']['Tables']['categories']['Row']

export async function getActiveCategories(supabase: SupabaseClient<Database>): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
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
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error(`Error fetching category for slug ${slug}:`, error)
    return null
  }

  return data
}

export async function adminGetCategories(supabase: SupabaseClient<Database>): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error in adminGetCategories:', error)
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
    .select('*')
    .single()

  if (error) throw error
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
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function adminDeleteCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
) : Promise<{ success: boolean; }> {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', categoryId)

  if (error) throw error
  return { success: true }
}
