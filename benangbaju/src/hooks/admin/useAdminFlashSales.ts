import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetFlashSales,
  adminCreateFlashSale,
  adminUpdateFlashSale,
  adminDeleteFlashSale,
} from '@/services/flashSales'
import { AdminFlashSaleListItem } from '@/modules/flashSale/domain/flashSale.types'

export interface AdminCreateFlashSaleInput {
  saleData: Parameters<typeof adminCreateFlashSale>[1]
  items: Parameters<typeof adminCreateFlashSale>[2]
}

export interface AdminUpdateFlashSaleInput {
  saleId: string
  saleData: Parameters<typeof adminUpdateFlashSale>[2]
  items: Parameters<typeof adminUpdateFlashSale>[3]
}

export function useAdminFlashSales() : UseQueryResult<AdminFlashSaleListItem[], Error> {
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
    mutationFn: ({ saleData, items }: AdminCreateFlashSaleInput) => adminCreateFlashSale(getAdminSupabase(), saleData, items),
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
    mutationFn: ({ saleId, saleData, items }: AdminUpdateFlashSaleInput) => adminUpdateFlashSale(getAdminSupabase(), saleId, saleData, items),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    }
  })
}

export function useAdminDeleteFlashSale() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (saleId: string) => adminDeleteFlashSale(getAdminSupabase(), saleId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['flash-sales'], ['flash-sales', 'homepage-data'])
    }
  })
}
