import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetReviews,
  adminUpdateReviewStatus,
  adminReplyToReview,
} from '@/services/reviews'
import { AdminReviewListItem } from '@/modules/review/domain/review.types'

export interface AdminUpdateReviewStatusInput {
  reviewId: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
}

export interface AdminReplyToReviewInput {
  reviewId: string
  body: string
  adminId: string
}

export function useAdminReviews() : UseQueryResult<AdminReviewListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => adminGetReviews(getAdminSupabase())
  })
}

export function useAdminUpdateReviewStatus() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateReviewStatus>>,
  Error,
  AdminUpdateReviewStatusInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, status }: AdminUpdateReviewStatusInput) => adminUpdateReviewStatus(getAdminSupabase(), reviewId, status),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['reviews'])
    }
  })
}

export function useAdminReplyToReview() : UseMutationResult<
  Awaited<ReturnType<typeof adminReplyToReview>>,
  Error,
  AdminReplyToReviewInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, body, adminId }: AdminReplyToReviewInput) => adminReplyToReview(getAdminSupabase(), reviewId, body, adminId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['reviews'])
    }
  })
}
