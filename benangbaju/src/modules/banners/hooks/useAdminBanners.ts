import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  getAdminBannersAction,
  createAdminBannerAction,
  updateAdminBannerAction,
  deleteAdminBannerAction,
} from '@/modules/banners/actions'
import { Banner } from '@/modules/banners/types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export type AdminCreateBannerInput = Parameters<typeof createAdminBannerAction>[0]

export interface AdminUpdateBannerInput {
  bannerId: string
  bannerData: Parameters<typeof updateAdminBannerAction>[1]
}

export function useAdminBanners(): UseQueryResult<ApiListResponse<Banner>, Error> {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => getAdminBannersAction(),
  })
}

export function useAdminCreateBanner(): UseMutationResult<
  Awaited<ReturnType<typeof createAdminBannerAction>>,
  Error,
  AdminCreateBannerInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bannerData: AdminCreateBannerInput) => {
      const res = await createAdminBannerAction(bannerData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat banner')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

export function useAdminUpdateBanner(): UseMutationResult<
  Awaited<ReturnType<typeof updateAdminBannerAction>>,
  Error,
  AdminUpdateBannerInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bannerId, bannerData }: AdminUpdateBannerInput) => {
      const res = await updateAdminBannerAction(bannerId, bannerData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui banner')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

export function useAdminDeleteBanner(): UseMutationResult<
  ApiResponse<void>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bannerId: string) => {
      const res = await deleteAdminBannerAction(bannerId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus banner')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['banners'], ['banners', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}
