import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateOrderParams } from '@/modules/orders/types'
import {
  getOrdersAction,
  getOrderDetailAction,
  cancelOrderAction,
  confirmDeliveryAction,
  generatePaymentTokenAction,
  checkPaymentStatusAction,
} from '@/modules/orders/actions'
import { createSecureOrderAction } from '@/modules/orders/actions'

export function useOrdersList(userId: string, status?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['orders', userId, status, page, limit],
    queryFn: () => getOrdersAction(userId, status, page, limit),
    enabled: !!userId,
  })
}

export function useOrderDetail(
  orderNumber: string,
  userId?: string,
  options?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: ['order', orderNumber, userId],
    queryFn: () => getOrderDetailAction(orderNumber, userId),
    enabled: !!orderNumber,
    refetchInterval: options?.refetchInterval ?? false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const res = await createSecureOrderAction(params)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat pesanan')
      if (!res.data) throw new Error('Data tidak tersedia')
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const res = await cancelOrderAction(orderId, reason)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membatalkan pesanan')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await confirmDeliveryAction(orderId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengkonfirmasi pesanan')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useGeneratePaymentToken() {
  return useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await generatePaymentTokenAction(orderNumber)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat token pembayaran')
      if (!res.data) throw new Error('Data tidak tersedia')
      return res.data
    },
  })
}

export function useCheckPaymentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await checkPaymentStatusAction(orderNumber)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengecek status pembayaran')
      if (!res.data) throw new Error('Data tidak tersedia')
      return res.data
    },
    onSuccess: (data) => {
      if (data.order_status !== 'pending_payment') {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['order'] })
      }
    },
  })
}
