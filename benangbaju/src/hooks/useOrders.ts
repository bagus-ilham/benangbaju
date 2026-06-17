import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getOrders,
  getOrderDetail,
  createOrder,
  cancelOrder,
  confirmDelivery,
  generatePaymentToken,
  CreateOrderParams,
} from '@/services/orders'

const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = createBrowserClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export function useOrdersList(userId: string, status?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['orders', userId, status, page, limit],
    queryFn: () => getOrders(supabase, userId, status, page, limit),
    enabled: !!userId,
  })
}

export function useOrderDetail(orderNumber: string) {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrderDetail(supabase, orderNumber),
    enabled: !!orderNumber,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateOrderParams) => createOrder(supabase, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrder(supabase, orderId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => confirmDelivery(supabase, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useGeneratePaymentToken() {
  return useMutation({
    mutationFn: (orderNumber: string) => generatePaymentToken(supabase, orderNumber),
  })
}
