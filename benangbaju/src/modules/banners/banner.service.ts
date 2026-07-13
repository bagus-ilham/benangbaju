import { bannerRepository } from './banner.repository'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import type { Banner } from './types'

export class BannerService {
  async getActiveBanners(page = 1, limit = 20): Promise<ApiListResponse<Banner>> {
    return bannerRepository.getActiveBanners(page, limit)
  }

  async adminGetBanners(page = 1, limit = 20): Promise<ApiListResponse<Banner>> {
    return bannerRepository.adminGetBanners(page, limit)
  }

  async adminCreateBanner(bannerData: {
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
  }): Promise<ApiResponse<Banner>> {
    return bannerRepository.adminCreateBanner(bannerData)
  }

  async adminUpdateBanner(
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
  ): Promise<ApiResponse<Banner>> {
    return bannerRepository.adminUpdateBanner(bannerId, bannerData)
  }

  async adminDeleteBanner(bannerId: string): Promise<ApiResponse<void>> {
    return bannerRepository.adminDeleteBanner(bannerId)
  }
}

export const bannerService = new BannerService()
