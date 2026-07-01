import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetRedirects,
  adminCreateRedirect,
  adminUpdateRedirect,
  adminDeleteRedirect,
  adminGetLandingPages,
  adminCreateLandingPage,
  adminUpdateLandingPage,
  adminDeleteLandingPage,
} from '@/services/cms'
import { RedirectRule, LandingPage } from '@/modules/cms/domain/cms.types'

export function useAdminRedirects() {
  return useQuery({
    queryKey: ['admin', 'redirects'],
    queryFn: () => adminGetRedirects(getAdminSupabase())
  })
}

export function useAdminCreateRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (redirect: Omit<RedirectRule, 'id' | 'created_at'>) =>
      adminCreateRedirect(getAdminSupabase(), redirect),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['redirects'])
    }
  })
}

export function useAdminUpdateRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ redirectId, redirect }: { redirectId: string; redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>> }) =>
      adminUpdateRedirect(getAdminSupabase(), redirectId, redirect),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['redirects'])
    }
  })
}

export function useAdminDeleteRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (redirectId: string) => adminDeleteRedirect(getAdminSupabase(), redirectId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['redirects'])
    }
  })
}

export function useAdminLandingPages() {
  return useQuery({
    queryKey: ['admin', 'landing-pages'],
    queryFn: () => adminGetLandingPages(getAdminSupabase())
  })
}

export function useAdminCreateLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) =>
      adminCreateLandingPage(getAdminSupabase(), landingPage),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['landing-pages'])
    }
  })
}

export function useAdminUpdateLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ landingPageId, landingPage }: { landingPageId: string; landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>> }) =>
      adminUpdateLandingPage(getAdminSupabase(), landingPageId, landingPage),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['landing-pages'])
    }
  })
}

export function useAdminDeleteLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (landingPageId: string) => adminDeleteLandingPage(getAdminSupabase(), landingPageId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['landing-pages'])
    }
  })
}
