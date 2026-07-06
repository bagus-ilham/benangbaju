import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminCustomersAction,
  toggleAdminCustomerStatusAction,
  getAdminCustomerDetailAction,
} from '@/modules/users/actions'

import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import { CustomerProfile, CustomerDetail } from '@/modules/users/adminCustomer.types'

export function useAdminCustomers(
  page = 1,
  limit = 20
): import('@tanstack/react-query').UseQueryResult<ApiListResponse<CustomerProfile>, Error> {
  return useQuery({
    queryKey: ['admin', 'customers', page, limit],
    queryFn: () => getAdminCustomersAction(page, limit),
  })
}

export function useAdminToggleCustomerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ customerId, isActive }: { customerId: string; isActive: boolean }) => {
      const res = await toggleAdminCustomerStatusAction(customerId, isActive)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengubah status pelanggan')
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useAdminCustomerDetail(
  customerId: string
): import('@tanstack/react-query').UseQueryResult<ApiResponse<CustomerDetail>, Error> {
  return useQuery({
    queryKey: ['admin', 'customer', customerId],
    queryFn: () => getAdminCustomerDetailAction(customerId),
    enabled: !!customerId,
  })
}
