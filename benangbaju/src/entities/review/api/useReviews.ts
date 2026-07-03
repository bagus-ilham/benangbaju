import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovedReviews, customerSubmitReview, SubmitReviewParams } from '@/features/core/services/reviews'
import { createBrowserClient } from '@/lib/supabase/client'

import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import { ProductReview } from '@/features/core/domain/review.types'

export function useReviews(productId: string) : import("@tanstack/react-query").UseQueryResult<ApiListResponse<import("@/features/core/services/reviews").ReviewDetail>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getApprovedReviews(supabase, productId),
    enabled: !!productId,
  })
}

export function useSubmitReview() : import("@tanstack/react-query").UseMutationResult<ApiResponse<ProductReview>, Error, SubmitReviewParams, unknown> {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SubmitReviewParams) => {
      const res = await customerSubmitReview(supabase, params)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengirim ulasan')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
    },
  })
}
