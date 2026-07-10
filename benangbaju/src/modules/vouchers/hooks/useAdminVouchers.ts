import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  getAdminVouchersAction,
  createAdminVoucherAction,
  updateAdminVoucherAction,
  deleteAdminVoucherAction,
} from '@/modules/vouchers/actions'

export type AdminCreateVoucherInput = Parameters<typeof createAdminVoucherAction>[0]

export interface AdminUpdateVoucherInput {
  voucherId: string
  voucherData: Parameters<typeof updateAdminVoucherAction>[1]
}

export function useAdminVouchers(): UseQueryResult<
  Awaited<ReturnType<typeof getAdminVouchersAction>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: () => getAdminVouchersAction(),
  })
}

export function useAdminCreateVoucher(): UseMutationResult<
  Awaited<ReturnType<typeof createAdminVoucherAction>>,
  Error,
  AdminCreateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (voucherData: AdminCreateVoucherInput) => {
      const res = await createAdminVoucherAction(voucherData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat voucher')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    },
  })
}

export function useAdminUpdateVoucher(): UseMutationResult<
  Awaited<ReturnType<typeof updateAdminVoucherAction>>,
  Error,
  AdminUpdateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ voucherId, voucherData }: AdminUpdateVoucherInput) => {
      const res = await updateAdminVoucherAction(voucherId, voucherData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui voucher')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    },
  })
}

export function useAdminDeleteVoucher(): UseMutationResult<
  Awaited<ReturnType<typeof deleteAdminVoucherAction>>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (voucherId: string) => {
      const res = await deleteAdminVoucherAction(voucherId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus voucher')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['vouchers'])
    },
  })
}
