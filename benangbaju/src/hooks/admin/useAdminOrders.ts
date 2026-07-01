import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminUpdateTrackingNumber,
  adminGetReturnRequests,
  adminUpdateReturnRequest,
} from '@/services/orders'
import { AdminOrderListItem, AdminReturnRequestListItem } from '@/modules/order/domain/order.types'

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

export function useAdminOrders(status = 'all', search = '', page = 1, limit = 20) : UseQueryResult<{ orders: AdminOrderListItem[]; totalCount: number; }, Error> {
  return useQuery({
    queryKey: ['admin', 'orders', status, search, page, limit],
    queryFn: () => adminGetOrders(getAdminSupabase(), { status, search, page, limit })
  })
}

export function useAdminUpdateOrderStatus() : UseMutationResult<{ success: boolean; message?: string; }, Error, AdminUpdateOrderStatusInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status, trackingNumber }: AdminUpdateOrderStatusInput) =>
      adminUpdateOrderStatus(getAdminSupabase(), orderId, status, trackingNumber),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['orders', 'dashboard'])
    }
  })
}

export function useAdminUpdateTrackingNumber() : UseMutationResult<{ success: boolean; message?: string; }, Error, { orderId: string, trackingNumber: string }, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, trackingNumber }: { orderId: string, trackingNumber: string }) =>
      adminUpdateTrackingNumber(getAdminSupabase(), orderId, trackingNumber),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['orders', 'dashboard'])
    }
  })
}

export function useAdminReturnRequests() : UseQueryResult<AdminReturnRequestListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'return-requests'],
    queryFn: () => adminGetReturnRequests(getAdminSupabase())
  })
}

export function useAdminUpdateReturnRequest() : UseMutationResult<{ success: boolean; }, Error, AdminUpdateReturnRequestInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, status, adminNotes, refundAmount }: AdminUpdateReturnRequestInput) =>
      adminUpdateReturnRequest(getAdminSupabase(), requestId, { status, adminNotes, refundAmount }),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['return-requests', 'orders'])
    }
  })
}
