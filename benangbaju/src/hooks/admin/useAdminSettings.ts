import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetSettings,
  adminUpdateSettings,
  adminGetActivityLogs,
  adminUpsertSettings,
  SiteSetting,
} from '@/services/settings'

export function useAdminSettings() : import("@tanstack/react-query").UseQueryResult<NoInfer<SiteSetting[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminGetSettings(getAdminSupabase())
  })
}

export function useAdminUpdateSettings() : import("@tanstack/react-query").UseMutationResult<void, Error, Record<string, string>, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, string>) => adminUpdateSettings(getAdminSupabase(), settings),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['settings'], ['settings', 'homepage-data'])
    }
  })
}

export function useAdminUpsertSettings() : import("@tanstack/react-query").UseMutationResult<void, Error, SiteSetting[], unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: SiteSetting[]) => adminUpsertSettings(getAdminSupabase(), settings),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['settings'], ['settings', 'homepage-data'])
    }
  })
}

export function useAdminActivityLogs() : import("@tanstack/react-query").UseQueryResult<NoInfer<import("@/services/settings").ActivityLog[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'activity-logs'],
    queryFn: () => adminGetActivityLogs(getAdminSupabase())
  })
}
