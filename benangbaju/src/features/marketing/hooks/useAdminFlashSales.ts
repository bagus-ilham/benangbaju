import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetFlashSales,
  adminCreateFlashSale,
  adminUpdateFlashSale,
  adminDeleteFlashSale,
} from '@/features/marketing/services/flashSales'
import { AdminFlashSaleListItem } from '@/features/marketing/domain/flashSale.types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export interface AdminCreateFlashSaleInput {
  saleData: Parameters<typeof adminCreateFlashSale>[1]
  items: Parameters<typeof adminCreateFlashSale>[2]
}

export interface AdminUpdateFlashSaleInput {
  saleId: string
  saleData: Parameters<typeof adminUpdateFlashSale>[2]
  items: Parameters<typeof adminUpdateFlashSale>[3]
}

export function useAdminFlashSales() : UseQueryResult<ApiListResponse<AdminFlashSaleListItem>, Error> {
  return useQuery({
    queryKey: ['admin', 'flash-sales'],
    queryFn: () => adminGetFlashSales(getAdminSupabase())
  })
}

export function useAdminCreateFlashSale() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateFlashSale>>,
  Error,
  AdminCreateFlashSaleInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleData, items }: AdminCreateFlashSaleInput) => {
      const res = await adminCreateFlashSale(getAdminSupabase(), saleData, items)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat flash sale')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    }
  })
}

export function useAdminUpdateFlashSale() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateFlashSale>>,
  Error,
  AdminUpdateFlashSaleInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, saleData, items }: AdminUpdateFlashSaleInput) => {
      const res = await adminUpdateFlashSale(getAdminSupabase(), saleId, saleData, items)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui flash sale')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    }
  })
}

export function useAdminDeleteFlashSale() : UseMutationResult<ApiResponse<void>, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (saleId: string) => {
      const res = await adminDeleteFlashSale(getAdminSupabase(), saleId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus flash sale')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    }
  })
}
