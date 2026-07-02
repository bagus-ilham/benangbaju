import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getOrders,
  getOrderDetail,
  cancelOrder,
  confirmDelivery,
  generatePaymentToken,
  checkPaymentStatus,
  CreateOrderParams,
} from '@/services/orders'
import { createSecureOrderAction } from '@/actions/checkout'

export function useOrdersList(userId: string, status?: string, page = 1, limit = 10) {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['orders', userId, status, page, limit],
    queryFn: () => getOrders(supabase, userId, status, page, limit),
    enabled: !!userId,
  })
}

export function useOrderDetail(orderNumber: string, userId?: string, options?: { refetchInterval?: number | false }) {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['order', orderNumber, userId],
    queryFn: () => getOrderDetail(supabase, orderNumber, userId),
    enabled: !!orderNumber,
    refetchInterval: options?.refetchInterval ?? false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const res = await createSecureOrderAction(params)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat pesanan')
      return res.data!
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const res = await cancelOrder(supabase, orderId, reason)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membatalkan pesanan')
      return res.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await confirmDelivery(supabase, orderId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengkonfirmasi pesanan')
      return res.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useGeneratePaymentToken() {
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await generatePaymentToken(supabase, orderNumber)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat token pembayaran')
      return res.data!
    },
  })
}

export function useCheckPaymentStatus() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await checkPaymentStatus(supabase, orderNumber)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengecek status pembayaran')
      return res.data!
    },
    onSuccess: (data) => {
      if (data.order_status !== 'pending_payment') {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['order'] })
      }
    },
  })
}
