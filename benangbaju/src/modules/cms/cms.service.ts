import { cmsRepository } from './cms.repository'
import type { RedirectRule, LandingPage } from './types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export class CmsService {
  async adminGetRedirects(page = 1, limit = 20): Promise<ApiListResponse<RedirectRule>> {
    return cmsRepository.adminGetRedirects(page, limit)
  }

  async adminCreateRedirect(
    redirect: Omit<RedirectRule, 'id' | 'created_at'>
  ): Promise<ApiResponse<RedirectRule>> {
    return cmsRepository.adminCreateRedirect(redirect)
  }

  async adminUpdateRedirect(
    redirectId: string,
    redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>>
  ): Promise<ApiResponse<void>> {
    return cmsRepository.adminUpdateRedirect(redirectId, redirect)
  }

  async adminDeleteRedirect(redirectId: string): Promise<ApiResponse<void>> {
    return cmsRepository.adminDeleteRedirect(redirectId)
  }

  async adminGetLandingPages(page = 1, limit = 20): Promise<ApiListResponse<LandingPage>> {
    return cmsRepository.adminGetLandingPages(page, limit)
  }

  async adminCreateLandingPage(
    landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<LandingPage>> {
    return cmsRepository.adminCreateLandingPage(landingPage)
  }

  async adminUpdateLandingPage(
    landingPageId: string,
    landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ApiResponse<void>> {
    return cmsRepository.adminUpdateLandingPage(landingPageId, landingPage)
  }

  async adminDeleteLandingPage(landingPageId: string): Promise<ApiResponse<void>> {
    return cmsRepository.adminDeleteLandingPage(landingPageId)
  }
}

export const cmsService = new CmsService()
