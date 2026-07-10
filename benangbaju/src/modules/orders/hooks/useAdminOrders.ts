import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetOrdersAction,
  adminGetReturnRequestsAction,
  adminUpdateReturnRequestAction,
  adminUpdateOrderStatusAction,
  adminUpdateTrackingNumberAction,
} from '@/modules/orders/actions'

export interface AdminUpdateOrderStatusInput {
  orderId: string
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  trackingNumber?: string
}

export interface AdminUpdateReturnRequestInput {
  requestId: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  adminNotes?: string | null
  refundAmount?: number | null
}

export function useAdminOrders(status = 'all', search = '', page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'orders', status, search, page, limit],
    queryFn: () => adminGetOrdersAction({ status, search, page, limit }),
  })
}

export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: AdminUpdateOrderStatusInput) => {
      const res = await adminUpdateOrderStatusAction(orderId, status, trackingNumber)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengupdate status pesanan')
      return res.data!
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['orders', 'dashboard'])
    },
  })
}

export function useAdminUpdateTrackingNumber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      trackingNumber,
    }: {
      orderId: string
      trackingNumber: string
    }) => {
      const res = await adminUpdateTrackingNumberAction(orderId, trackingNumber)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menyimpan resi')
      return res.data!
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['orders', 'dashboard'])
    },
  })
}

export function useAdminReturnRequests() {
  return useQuery({
    queryKey: ['admin', 'return-requests'],
    queryFn: () => adminGetReturnRequestsAction(),
  })
}

export function useAdminUpdateReturnRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      adminNotes,
      refundAmount,
    }: AdminUpdateReturnRequestInput) => {
      const res = await adminUpdateReturnRequestAction(requestId, {
        status,
        adminNotes,
        refundAmount,
      })
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengupdate permintaan retur')
      return res.data!
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['return-requests', 'orders'])
    },
  })
}
