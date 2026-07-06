import { useQuery } from '@tanstack/react-query'
import { getAdminAnalyticsAction } from '@/modules/analytics/actions'
import { getAdminDashboardStatsAction } from '@/modules/analytics/actions'

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => getAdminDashboardStatsAction(),
  })
}

export function useAdminAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['admin', 'analytics', days],
    queryFn: () => getAdminAnalyticsAction(days),
  })
}
