import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} from '@/services/banners'
import { Banner } from '@/modules/banner/domain/banner.types'

export type AdminCreateBannerInput = Parameters<typeof adminCreateBanner>[1]

export interface AdminUpdateBannerInput {
  bannerId: string
  bannerData: Parameters<typeof adminUpdateBanner>[2]
}

export function useAdminBanners() : UseQueryResult<Banner[], Error> {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => adminGetBanners(getAdminSupabase())
  })
}

export function useAdminCreateBanner() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateBanner>>,
  Error,
  AdminCreateBannerInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerData: AdminCreateBannerInput) => adminCreateBanner(getAdminSupabase(), bannerData),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}

export function useAdminUpdateBanner() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateBanner>>,
  Error,
  AdminUpdateBannerInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bannerId, bannerData }: AdminUpdateBannerInput) => adminUpdateBanner(getAdminSupabase(), bannerId, bannerData),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}

export function useAdminDeleteBanner() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerId: string) => adminDeleteBanner(getAdminSupabase(), bannerId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}
