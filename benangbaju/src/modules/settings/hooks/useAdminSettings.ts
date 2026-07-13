import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetSettingsAction,
  adminUpdateSettingsAction,
  adminUpsertSettingsAction,
} from '@/modules/settings/actions'
import type { SiteSetting } from '@/modules/settings/types'

import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export function useAdminSettings(): import('@tanstack/react-query').UseQueryResult<
  NoInfer<ApiListResponse<SiteSetting>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminGetSettingsAction(),
  })
}

export function useAdminUpdateSettings(): import('@tanstack/react-query').UseMutationResult<
  ApiResponse<void>,
  Error,
  Record<string, string>,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const res = await adminUpdateSettingsAction(settings)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui pengaturan')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['settings'], ['settings', 'homepage-data'])
    },
  })
}

export function useAdminUpsertSettings(): import('@tanstack/react-query').UseMutationResult<
  ApiResponse<void>,
  Error,
  SiteSetting[],
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: SiteSetting[]) => {
      const res = await adminUpsertSettingsAction(settings)
      if (!res.success) throw new Error(res.error?.message || 'Gagal upsert pengaturan')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['settings'], ['settings', 'homepage-data'])
    },
  })
}
