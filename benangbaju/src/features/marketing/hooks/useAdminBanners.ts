import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} from '@/features/marketing/services/banners'
import { Banner } from '@/features/marketing/domain/banner.types'

export type AdminCreateBannerInput = Parameters<typeof adminCreateBanner>[1]

export interface AdminUpdateBannerInput {
  bannerId: string
  bannerData: Parameters<typeof adminUpdateBanner>[2]
}

import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export function useAdminBanners() : UseQueryResult<ApiListResponse<Banner>, Error> {
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
    mutationFn: async (bannerData: AdminCreateBannerInput) => {
      const res = await adminCreateBanner(getAdminSupabase(), bannerData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat banner')
      return res
    },
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
    mutationFn: async ({ bannerId, bannerData }: AdminUpdateBannerInput) => {
      const res = await adminUpdateBanner(getAdminSupabase(), bannerId, bannerData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui banner')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}

export function useAdminDeleteBanner() : UseMutationResult<ApiResponse<void>, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bannerId: string) => {
      const res = await adminDeleteBanner(getAdminSupabase(), bannerId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus banner')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}
