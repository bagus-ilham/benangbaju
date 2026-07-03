import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminDeleteVoucher,
} from '@/features/marketing/services/vouchers'

export type AdminCreateVoucherInput = Parameters<typeof adminCreateVoucher>[1]

export interface AdminUpdateVoucherInput {
  voucherId: string
  voucherData: Parameters<typeof adminUpdateVoucher>[2]
}

export function useAdminVouchers(): UseQueryResult<
  Awaited<ReturnType<typeof adminGetVouchers>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: () => adminGetVouchers(getAdminSupabase()),
  })
}

export function useAdminCreateVoucher(): UseMutationResult<
  Awaited<ReturnType<typeof adminCreateVoucher>>,
  Error,
  AdminCreateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (voucherData: AdminCreateVoucherInput) => {
      const res = await adminCreateVoucher(getAdminSupabase(), voucherData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat voucher')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    },
  })
}

export function useAdminUpdateVoucher(): UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateVoucher>>,
  Error,
  AdminUpdateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ voucherId, voucherData }: AdminUpdateVoucherInput) => {
      const res = await adminUpdateVoucher(getAdminSupabase(), voucherId, voucherData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui voucher')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    },
  })
}

export function useAdminDeleteVoucher(): UseMutationResult<
  Awaited<ReturnType<typeof adminDeleteVoucher>>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (voucherId: string) => {
      const res = await adminDeleteVoucher(getAdminSupabase(), voucherId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus voucher')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    },
  })
}
