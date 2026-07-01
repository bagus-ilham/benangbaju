import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminCustomersAction,
  toggleAdminCustomerStatusAction,
  getAdminCustomerDetailAction,
} from '@/actions/admin'

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => getAdminCustomersAction()
  })
}

export function useAdminToggleCustomerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, isActive }: { customerId: string; isActive: boolean }) =>
      toggleAdminCustomerStatusAction(customerId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

export function useAdminCustomerDetail(customerId: string) {
  return useQuery({
    queryKey: ['admin', 'customer', customerId],
    queryFn: () => getAdminCustomerDetailAction(customerId),
    enabled: !!customerId,
  })
}
