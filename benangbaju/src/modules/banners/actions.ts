'use server'

import { bannerService } from './banner.service'
import { requireAdmin } from '@/lib/auth-guard'

// Public Actions
export async function getActiveBannersAction(page = 1, limit = 20) {
  return bannerService.getActiveBanners(page, limit)
}

// Admin Actions
export async function getAdminBannersAction(page = 1, limit = 20) {
  await requireAdmin()
  return bannerService.adminGetBanners(page, limit)
}

export async function createAdminBannerAction(bannerData: {
  title: string
  subtitle: string | null
  image_url: string
  image_mobile_url: string | null
  link_url: string | null
  position: string
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}) {
  await requireAdmin()
  return bannerService.adminCreateBanner(bannerData)
}

export async function updateAdminBannerAction(
  bannerId: string,
  bannerData: {
    title?: string
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
  await requireAdmin()
  return bannerService.adminUpdateBanner(bannerId, bannerData)
}

export async function deleteAdminBannerAction(bannerId: string) {
  await requireAdmin()
  return bannerService.adminDeleteBanner(bannerId)
}
