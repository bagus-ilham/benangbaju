import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovedReviews, customerSubmitReview, SubmitReviewParams } from '@/services/reviews'
import { createBrowserClient } from '@/lib/supabase/client'

export function useReviews(productId: string) : import("@tanstack/react-query").UseQueryResult<NoInfer<import("@/services/reviews").ReviewDetail[]>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getApprovedReviews(supabase, productId),
    enabled: !!productId,
  })
}

export function useSubmitReview() : import("@tanstack/react-query").UseMutationResult<{ id: string; order_item_id: string; product_id: string; variant_id: string | null; user_id: string; rating: number; title: string | null; body: string; is_anonymous: boolean; is_verified_purchase: boolean; is_pinned: boolean; status: string; helpful_count: number; created_at: string; }, Error, SubmitReviewParams, unknown> {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SubmitReviewParams) => customerSubmitReview(supabase, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
    },
  })
}
