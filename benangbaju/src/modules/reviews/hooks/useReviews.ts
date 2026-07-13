import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovedReviewsAction, submitReviewAction } from '@/modules/reviews/actions'
import { SubmitReviewParams } from '@/modules/reviews/types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import { ProductReview, ReviewDetail } from '@/modules/reviews/types'

export function useReviews(
  productId: string
): import('@tanstack/react-query').UseQueryResult<ApiListResponse<ReviewDetail>, Error> {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getApprovedReviewsAction(productId),
    enabled: !!productId,
  })
}

export function useSubmitReview(): import('@tanstack/react-query').UseMutationResult<
  ApiResponse<ProductReview>,
  Error,
  Omit<SubmitReviewParams, 'userId'>,
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: Omit<SubmitReviewParams, 'userId'>) => {
      const res = await submitReviewAction(params)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengirim ulasan')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
    },
  })
}
