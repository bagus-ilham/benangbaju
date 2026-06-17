import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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
  content: Record<string, unknown>
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

  return (data || []) as RedirectRule[]
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

  return data as RedirectRule
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

  return (data || []) as unknown as LandingPage[]
}

export async function adminCreateLandingPage(
  supabase: SupabaseClient<Database>,
  landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>
): Promise<LandingPage> {
  const { data, error } = await supabase
    .from('landing_pages')
    .insert([landingPage as any]) // bypass jsonb cast
    .select()
    .single()

  if (error) {
    console.error('Error creating landing page:', error)
    throw error
  }

  return data as unknown as LandingPage
}

export async function adminUpdateLandingPage(
  supabase: SupabaseClient<Database>,
  landingPageId: string,
  landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('landing_pages')
    .update(landingPage as any)
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
