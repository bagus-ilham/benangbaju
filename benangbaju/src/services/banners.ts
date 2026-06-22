import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type Banner = Database['public']['Tables']['banners']['Row']

export async function getActiveBanners(supabase: SupabaseClient<Database>): Promise<Banner[]> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching banners:', error)
    return []
  }

  return data || []
}

export async function adminGetBanners(supabase: SupabaseClient<Database>): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching admin banners:', error)
    throw error
  }

  return data || []
}

export async function adminCreateBanner(
  supabase: SupabaseClient<Database>,
  bannerData: {
    title: string | null
    subtitle: string | null
    image_url: string
    image_mobile_url: string | null
    link_url: string | null
    position: string
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  }
) : Promise<{ id: string; title: string | null; subtitle: string | null; image_url: string; image_mobile_url: string | null; link_url: string | null; position: string; sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null; }> {
  const { data, error } = await supabase
    .from('banners')
    .insert(bannerData)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function adminUpdateBanner(
  supabase: SupabaseClient<Database>,
  bannerId: string,
  bannerData: {
    title: string | null
    subtitle: string | null
    image_url: string
    image_mobile_url: string | null
    link_url: string | null
    position: string
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  }
) : Promise<{ id: string; title: string | null; subtitle: string | null; image_url: string; image_mobile_url: string | null; link_url: string | null; position: string; sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null; }> {
  const { data, error } = await supabase
    .from('banners')
    .update(bannerData)
    .eq('id', bannerId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function adminDeleteBanner(
  supabase: SupabaseClient<Database>,
  bannerId: string
) : Promise<{ success: boolean; }> {
  const { error } = await supabase
    .from('banners')
    .update({ is_active: false })
    .eq('id', bannerId)

  if (error) throw error
  return { success: true }
}
