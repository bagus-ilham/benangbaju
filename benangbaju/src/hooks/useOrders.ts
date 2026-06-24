import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getOrders,
  getOrderDetail,
  createOrder,
  cancelOrder,
  confirmDelivery,
  generatePaymentToken,
  checkPaymentStatus,
  CreateOrderParams,
} from '@/services/orders'

export function useOrdersList(userId: string, status?: string, page = 1, limit = 10) : import("@tanstack/react-query").UseQueryResult<{ orders: import("@/services/orders").Order[]; totalCount: number; }, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['orders', userId, status, page, limit],
    queryFn: () => getOrders(supabase, userId, status, page, limit),
    enabled: !!userId,
  })
}

export function useOrderDetail(orderNumber: string, userId?: string, options?: { refetchInterval?: number | false }) : import("@tanstack/react-query").UseQueryResult<import("@/services/orders").Order | null, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['order', orderNumber, userId],
    queryFn: () => getOrderDetail(supabase, orderNumber, userId),
    enabled: !!orderNumber,
    refetchInterval: options?.refetchInterval ?? false,
  })
}

export function useCreateOrder() : import("@tanstack/react-query").UseMutationResult<import("@/services/orders").OrderRpcResponse, Error, CreateOrderParams, unknown> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: (params: CreateOrderParams) => createOrder(supabase, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] })
    },
  })
}

export function useCancelOrder() : import("@tanstack/react-query").UseMutationResult<{ success: boolean; message?: string; }, Error, { orderId: string; reason?: string; }, unknown> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrder(supabase, orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useConfirmDelivery() : import("@tanstack/react-query").UseMutationResult<{ success: boolean; message?: string; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: (orderId: string) => confirmDelivery(supabase, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useGeneratePaymentToken() : import("@tanstack/react-query").UseMutationResult<{ success: boolean; token?: string; redirect_url?: string; message?: string; }, Error, string, unknown> {
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: (orderNumber: string) => generatePaymentToken(supabase, orderNumber),
  })
}

export function useCheckPaymentStatus() : import("@tanstack/react-query").UseMutationResult<{ success: boolean; order_status?: string; payment_status?: string; message?: string; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: (orderNumber: string) => checkPaymentStatus(supabase, orderNumber),
    onSuccess: (data) => {
      if (data.success && data.order_status !== 'pending_payment') {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['order'] })
      }
    },
  })
}
