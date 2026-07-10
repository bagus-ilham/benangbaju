import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  getAdminReviewsAction,
  updateAdminReviewStatusAction,
  adminReplyToReviewAction,
} from '@/modules/reviews/actions'
import { AdminReviewListItem } from '@/modules/reviews/types'
import { ApiListResponse } from '@/lib/api-response'

export interface AdminUpdateReviewStatusInput {
  reviewId: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
}

export interface AdminReplyToReviewInput {
  reviewId: string
  body: string
}

export function useAdminReviews(): UseQueryResult<ApiListResponse<AdminReviewListItem>, Error> {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => getAdminReviewsAction(),
  })
}

export function useAdminUpdateReviewStatus(): UseMutationResult<
  Awaited<ReturnType<typeof updateAdminReviewStatusAction>>,
  Error,
  AdminUpdateReviewStatusInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, status }: AdminUpdateReviewStatusInput) => {
      const res = await updateAdminReviewStatusAction(reviewId, status)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui status review')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['reviews'])
    },
  })
}

export function useAdminReplyToReview(): UseMutationResult<
  Awaited<ReturnType<typeof adminReplyToReviewAction>>,
  Error,
  AdminReplyToReviewInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, body }: AdminReplyToReviewInput) => {
      const res = await adminReplyToReviewAction(reviewId, body)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membalas review')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['reviews'])
    },
  })
}
