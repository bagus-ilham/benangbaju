import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovedReviews, customerSubmitReview, SubmitReviewParams } from '@/services/reviews'
import { createBrowserClient } from '@/lib/supabase/client'

export function useReviews(productId: string) {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getApprovedReviews(supabase, productId),
    enabled: !!productId,
  })
}

export function useSubmitReview() {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SubmitReviewParams) => customerSubmitReview(supabase, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
    },
  })
}
