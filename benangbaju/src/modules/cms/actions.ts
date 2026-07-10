'use server'

import { cmsService } from './cms.service'
import { requireAdmin } from '@/lib/auth-guard'
import type { RedirectRule, LandingPage } from './types'

export async function adminGetRedirectsAction(page = 1, limit = 20) {
  await requireAdmin()
  return cmsService.adminGetRedirects(page, limit)
}

export async function adminCreateRedirectAction(redirect: Omit<RedirectRule, 'id' | 'created_at'>) {
  await requireAdmin()
  return cmsService.adminCreateRedirect(redirect)
}

export async function adminUpdateRedirectAction(
  redirectId: string,
  redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>>
) {
  await requireAdmin()
  return cmsService.adminUpdateRedirect(redirectId, redirect)
}

export async function adminDeleteRedirectAction(redirectId: string) {
  await requireAdmin()
  return cmsService.adminDeleteRedirect(redirectId)
}

export async function adminGetLandingPagesAction(page = 1, limit = 20) {
  await requireAdmin()
  return cmsService.adminGetLandingPages(page, limit)
}

export async function adminCreateLandingPageAction(
  landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>
) {
  await requireAdmin()
  return cmsService.adminCreateLandingPage(landingPage)
}

export async function adminUpdateLandingPageAction(
  landingPageId: string,
  landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>
) {
  await requireAdmin()
  return cmsService.adminUpdateLandingPage(landingPageId, landingPage)
}

export async function adminDeleteLandingPageAction(landingPageId: string) {
  await requireAdmin()
  return cmsService.adminDeleteLandingPage(landingPageId)
}
