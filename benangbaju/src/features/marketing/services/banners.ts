import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { BannerService } from '@/features/marketing/application/banner.service'
import * as types from '@/features/marketing/domain/banner.types'

export type { Banner } from '@/features/marketing/domain/banner.types'

export async function getActiveBanners(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
  return new BannerService(supabase).getActiveBanners(page, limit)
}

export async function adminGetBanners(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
  return new BannerService(supabase).adminGetBanners(page, limit)
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
) {
  return new BannerService(supabase).adminCreateBanner(bannerData)
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
) {
  return new BannerService(supabase).adminUpdateBanner(bannerId, bannerData)
}

export async function adminDeleteBanner(supabase: SupabaseClient<Database>, bannerId: string) {
  return new BannerService(supabase).adminDeleteBanner(bannerId)
}
