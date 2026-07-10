import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetFlashSalesAction,
  adminCreateFlashSaleAction,
  adminUpdateFlashSaleAction,
  adminDeleteFlashSaleAction,
} from '@/modules/flash-sales/actions'
import { AdminFlashSaleListItem } from '@/modules/flash-sales/types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export interface AdminCreateFlashSaleInput {
  saleData: Parameters<typeof adminCreateFlashSaleAction>[0]
  items: Parameters<typeof adminCreateFlashSaleAction>[1]
}

export interface AdminUpdateFlashSaleInput {
  saleId: string
  saleData: Parameters<typeof adminUpdateFlashSaleAction>[1]
  items: Parameters<typeof adminUpdateFlashSaleAction>[2]
}

export function useAdminFlashSales(): UseQueryResult<
  ApiListResponse<AdminFlashSaleListItem>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'flash-sales'],
    queryFn: () => adminGetFlashSalesAction(),
  })
}

export function useAdminCreateFlashSale(): UseMutationResult<
  Awaited<ReturnType<typeof adminCreateFlashSaleAction>>,
  Error,
  AdminCreateFlashSaleInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleData, items }: AdminCreateFlashSaleInput) => {
      const res = await adminCreateFlashSaleAction(saleData, items)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat flash sale')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    },
  })
}

export function useAdminUpdateFlashSale(): UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateFlashSaleAction>>,
  Error,
  AdminUpdateFlashSaleInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, saleData, items }: AdminUpdateFlashSaleInput) => {
      const res = await adminUpdateFlashSaleAction(saleId, saleData, items)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui flash sale')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    },
  })
}

export function useAdminDeleteFlashSale(): UseMutationResult<
  ApiResponse<void>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (saleId: string) => {
      const res = await adminDeleteFlashSaleAction(saleId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus flash sale')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    },
  })
}
