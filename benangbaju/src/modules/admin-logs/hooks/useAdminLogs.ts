import { useQuery } from '@tanstack/react-query'
import { getAdminActivityLogsAction } from '@/modules/admin-logs/actions'
import { ActivityLog } from '@/modules/admin-logs/types'
import { ApiListResponse } from '@/lib/api-response'

export function useAdminActivityLogs(): import('@tanstack/react-query').UseQueryResult<
  NoInfer<ApiListResponse<ActivityLog>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'activity-logs'],
    queryFn: () => getAdminActivityLogsAction(),
  })
}
