import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/services/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { RedirectRule, LandingPage } from "../domain/cms.types";

// =============================================================
// REDIRECTS CRUD
// =============================================================

export async function adminGetRedirects(supabase: SupabaseClient<Database>): Promise<RedirectRule[]> {
  const { data, error } = await supabase
    .from('redirects')
    .select('id, from_path, to_path, status_code, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    safeLogError('Error fetching redirects:', error)
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
    safeLogError('Error creating redirect:', error)
    throw error
  }

  const result = {
    id: data.id,
    from_path: data.from_path,
    to_path: data.to_path,
    status_code: data.status_code,
    is_active: data.is_active,
    created_at: data.created_at,
  }

  await insertAdminActivityLog(supabase, 'create', 'redirect', data.id, `Created redirect from ${data.from_path}`)

  return result
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
    safeLogError('Error updating redirect:', error)
    throw error
  }
  
  await insertAdminActivityLog(supabase, 'update', 'redirect', redirectId, `Updated redirect ${redirectId}`)
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
    safeLogError('Error deleting redirect:', error)
    throw error
  }
  
  await insertAdminActivityLog(supabase, 'delete', 'redirect', redirectId, `Deleted redirect ${redirectId}`)
}

// =============================================================
// LANDING PAGES CRUD
// =============================================================

export async function adminGetLandingPages(supabase: SupabaseClient<Database>): Promise<LandingPage[]> {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, slug, title, content, meta_title, meta_description, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    safeLogError('Error fetching landing pages:', error)
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
    safeLogError('Error creating landing page:', error)
    throw error
  }

  const result = {
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

  await insertAdminActivityLog(supabase, 'create', 'landing_page', data.id, `Created landing page ${data.slug}`)

  return result
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
    safeLogError('Error updating landing page:', error)
    throw error
  }
  
  await insertAdminActivityLog(supabase, 'update', 'landing_page', landingPageId, `Updated landing page ${landingPageId}`)
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
    safeLogError('Error deleting landing page:', error)
    throw error
  }
  
  await insertAdminActivityLog(supabase, 'delete', 'landing_page', landingPageId, `Deleted landing page ${landingPageId}`)
}
