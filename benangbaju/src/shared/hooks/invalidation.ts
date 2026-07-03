import { QueryClient } from '@tanstack/react-query'
import { revalidateCacheTag } from '@/shared/actions/revalidate'

export function invalidateAdminQueries(
  queryClient: QueryClient,
  domains: string[],
  tags: string[] = []
) {
  for (const domain of domains) {
    queryClient.invalidateQueries({ queryKey: ['admin', domain] })
  }
  for (const tag of tags) {
    revalidateCacheTag(tag)
  }
}
