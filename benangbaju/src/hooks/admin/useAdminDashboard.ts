import { useQuery } from '@tanstack/react-query'
import { getAdminAnalyticsAction } from '@/actions/analytics'
import { getAdminDashboardStatsAction } from '@/actions/admin'

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
