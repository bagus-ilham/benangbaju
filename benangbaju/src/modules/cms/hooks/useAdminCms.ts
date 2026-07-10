import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetRedirectsAction,
  adminCreateRedirectAction,
  adminUpdateRedirectAction,
  adminDeleteRedirectAction,
  adminGetLandingPagesAction,
  adminCreateLandingPageAction,
  adminUpdateLandingPageAction,
  adminDeleteLandingPageAction,
} from '@/modules/cms/actions'
import { RedirectRule, LandingPage } from '@/modules/cms/types'

export function useAdminRedirects() {
  return useQuery({
    queryKey: ['admin', 'redirects'],
    queryFn: () => adminGetRedirectsAction(),
  })
}

export function useAdminCreateRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (redirect: Omit<RedirectRule, 'id' | 'created_at'>) => {
      const res = await adminCreateRedirectAction(redirect)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat redirect')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['redirects'])
    },
  })
}

export function useAdminUpdateRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      redirectId,
      redirect,
    }: {
      redirectId: string
      redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>>
    }) => {
      const res = await adminUpdateRedirectAction(redirectId, redirect)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui redirect')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['redirects'])
    },
  })
}

export function useAdminDeleteRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (redirectId: string) => {
      const res = await adminDeleteRedirectAction(redirectId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus redirect')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['redirects'])
    },
  })
}

export function useAdminLandingPages() {
  return useQuery({
    queryKey: ['admin', 'landing-pages'],
    queryFn: () => adminGetLandingPagesAction(),
  })
}

export function useAdminCreateLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) => {
      const res = await adminCreateLandingPageAction(landingPage)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat landing page')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['landing-pages'])
    },
  })
}

export function useAdminUpdateLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      landingPageId,
      landingPage,
    }: {
      landingPageId: string
      landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>
    }) => {
      const res = await adminUpdateLandingPageAction(landingPageId, landingPage)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui landing page')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['landing-pages'])
    },
  })
}

export function useAdminDeleteLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (landingPageId: string) => {
      const res = await adminDeleteLandingPageAction(landingPageId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus landing page')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['landing-pages'])
    },
  })
}
