import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminDeleteVoucher,
} from '@/services/vouchers'

export type AdminCreateVoucherInput = Parameters<typeof adminCreateVoucher>[1]

export interface AdminUpdateVoucherInput {
  voucherId: string
  voucherData: Parameters<typeof adminUpdateVoucher>[2]
}

export function useAdminVouchers() : UseQueryResult<Awaited<ReturnType<typeof adminGetVouchers>>, Error> {
  return useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: () => adminGetVouchers(getAdminSupabase())
  })
}

export function useAdminCreateVoucher() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateVoucher>>,
  Error,
  AdminCreateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherData: AdminCreateVoucherInput) => adminCreateVoucher(getAdminSupabase(), voucherData),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    }
  })
}

export function useAdminUpdateVoucher() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateVoucher>>,
  Error,
  AdminUpdateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ voucherId, voucherData }: AdminUpdateVoucherInput) => adminUpdateVoucher(getAdminSupabase(), voucherId, voucherData),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    }
  })
}

export function useAdminDeleteVoucher() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherId: string) => adminDeleteVoucher(getAdminSupabase(), voucherId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    }
  })
}
