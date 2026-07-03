import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetSettings,
  adminUpdateSettings,
  adminGetActivityLogs,
  adminUpsertSettings,
  SiteSetting,
} from '@/features/core/services/settings'

import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export function useAdminSettings(): import('@tanstack/react-query').UseQueryResult<
  NoInfer<ApiListResponse<SiteSetting>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminGetSettings(getAdminSupabase()),
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
      const res = await adminUpdateSettings(getAdminSupabase(), settings)
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
      const res = await adminUpsertSettings(getAdminSupabase(), settings)
      if (!res.success) throw new Error(res.error?.message || 'Gagal upsert pengaturan')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['settings'], ['settings', 'homepage-data'])
    },
  })
}

export function useAdminActivityLogs(): import('@tanstack/react-query').UseQueryResult<
  NoInfer<ApiListResponse<import('@/features/core/services/settings').ActivityLog>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'activity-logs'],
    queryFn: () => adminGetActivityLogs(getAdminSupabase()),
  })
}
