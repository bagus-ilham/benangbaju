import { useQuery } from '@tanstack/react-query'
import { getAdminAnalyticsAction } from '@/features/core/actions/analytics'
import { getAdminDashboardStatsAction } from '@/features/core/actions/dashboard'

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => getAdminDashboardStatsAction()
  })
}

export function useAdminAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['admin', 'analytics', days],
    queryFn: () => getAdminAnalyticsAction(days)
  })
}
