import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetReviews,
  adminUpdateReviewStatus,
  adminReplyToReview,
} from '@/modules/reviews/services'
import { AdminReviewListItem } from '@/modules/reviews/types'
import { ApiListResponse } from '@/lib/api-response'

export interface AdminUpdateReviewStatusInput {
  reviewId: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
}

export interface AdminReplyToReviewInput {
  reviewId: string
  body: string
  adminId: string
}

export function useAdminReviews(): UseQueryResult<ApiListResponse<AdminReviewListItem>, Error> {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => adminGetReviews(getAdminSupabase()),
  })
}

export function useAdminUpdateReviewStatus(): UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateReviewStatus>>,
  Error,
  AdminUpdateReviewStatusInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, status }: AdminUpdateReviewStatusInput) => {
      const res = await adminUpdateReviewStatus(getAdminSupabase(), reviewId, status)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui status review')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['reviews'])
    },
  })
}

export function useAdminReplyToReview(): UseMutationResult<
  Awaited<ReturnType<typeof adminReplyToReview>>,
  Error,
  AdminReplyToReviewInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, body, adminId }: AdminReplyToReviewInput) => {
      const res = await adminReplyToReview(getAdminSupabase(), reviewId, body, adminId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membalas review')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['reviews'])
    },
  })
}
