import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetVariantsAction,
  adminUpdateVariantAction,
  adminBatchUpdateVariantsAction,
} from '@/modules/products/actions'
import type { AdminVariantListItem, UpdateVariantInput } from '@/modules/products/types'
import type { ApiListResponse } from '@/lib/api-response'

export interface GetVariantsQueryParams {
  page?: number
  limit?: number
  search?: string
  stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  statusFilter?: 'all' | 'active' | 'inactive'
  sortBy?: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'
}

export function useAdminVariants(
  params: GetVariantsQueryParams = {}
): UseQueryResult<ApiListResponse<AdminVariantListItem>, Error> {
  const {
    page = 1,
    limit = 20,
    search = '',
    stockFilter = 'all',
    statusFilter = 'all',
    sortBy = 'newest',
  } = params

  return useQuery({
    queryKey: ['admin', 'variants', page, limit, search, stockFilter, statusFilter, sortBy],
    queryFn: () => adminGetVariantsAction({ page, limit, search, stockFilter, statusFilter, sortBy }),
  })
}

export function useAdminUpdateVariant(): UseMutationResult<
  void,
  Error,
  { variantId: string; data: UpdateVariantInput },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ variantId, data }: { variantId: string; data: UpdateVariantInput }) => {
      await adminUpdateVariantAction(variantId, data)
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['variants', 'products', 'dashboard'], ['products', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useAdminBatchUpdateVariants(): UseMutationResult<
  void,
  Error,
  UpdateVariantInput[],
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: UpdateVariantInput[]) => {
      await adminBatchUpdateVariantsAction(updates)
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['variants', 'products', 'dashboard'], ['products', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
