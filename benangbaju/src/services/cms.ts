import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

export interface RedirectRule {
  id: string
  from_path: string
  to_path: string
  status_code: number
  is_active: boolean
  created_at: string
}

export interface LandingPage {
  id: string
  slug: string
  title: string
  content: Json
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// =============================================================
// REDIRECTS CRUD
// =============================================================

export async function adminGetRedirects(supabase: SupabaseClient<Database>): Promise<RedirectRule[]> {
  const { data, error } = await supabase
    .from('redirects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching redirects:', error)
    throw error
  }

  if (!data) return []
  return data.map(row => ({
    id: row.id,
    from_path: row.from_path,
    to_path: row.to_path,
    status_code: row.status_code,
    is_active: row.is_active,
    created_at: row.created_at,
  }))
}

export async function adminCreateRedirect(
  supabase: SupabaseClient<Database>,
  redirect: Omit<RedirectRule, 'id' | 'created_at'>
): Promise<RedirectRule> {
  const { data, error } = await supabase
    .from('redirects')
    .insert([redirect])
    .select()
    .single()

  if (error) {
    console.error('Error creating redirect:', error)
    throw error
  }

  return {
    id: data.id,
    from_path: data.from_path,
    to_path: data.to_path,
    status_code: data.status_code,
    is_active: data.is_active,
    created_at: data.created_at,
  }
}

export async function adminUpdateRedirect(
  supabase: SupabaseClient<Database>,
  redirectId: string,
  redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('redirects')
    .update(redirect)
    .eq('id', redirectId)

  if (error) {
    console.error('Error updating redirect:', error)
    throw error
  }
}

export async function adminDeleteRedirect(
  supabase: SupabaseClient<Database>,
  redirectId: string
): Promise<void> {
  const { error } = await supabase
    .from('redirects')
    .delete()
    .eq('id', redirectId)

  if (error) {
    console.error('Error deleting redirect:', error)
    throw error
  }
}

// =============================================================
// LANDING PAGES CRUD
// =============================================================

export async function adminGetLandingPages(supabase: SupabaseClient<Database>): Promise<LandingPage[]> {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching landing pages:', error)
    throw error
  }

  if (!data) return []
  return data.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function adminCreateLandingPage(
  supabase: SupabaseClient<Database>,
  landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>
): Promise<LandingPage> {
  const { data, error } = await supabase
    .from('landing_pages')
    .insert([landingPage])
    .select()
    .single()

  if (error) {
    console.error('Error creating landing page:', error)
    throw error
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    content: data.content,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function adminUpdateLandingPage(
  supabase: SupabaseClient<Database>,
  landingPageId: string,
  landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('landing_pages')
    .update(landingPage)
    .eq('id', landingPageId)

  if (error) {
    console.error('Error updating landing page:', error)
    throw error
  }
}

export async function adminDeleteLandingPage(
  supabase: SupabaseClient<Database>,
  landingPageId: string
): Promise<void> {
  const { error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', landingPageId)

  if (error) {
    console.error('Error deleting landing page:', error)
    throw error
  }
}
