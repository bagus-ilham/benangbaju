import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  searchDistricts,
  calculateShippingRates,
  UserAddress,
} from '@/services/shipping'

const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = createBrowserClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export function useUserAddresses(userId: string) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => getUserAddresses(supabase, userId),
    enabled: !!userId,
  })
}

export function useAddUserAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (address: Omit<UserAddress, 'id' | 'created_at'>) =>
      addUserAddress(supabase, address),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.user_id] })
    },
  })
}

export function useUpdateUserAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      addressId,
      userId,
      address,
    }: {
      addressId: string
      userId: string
      address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
    }) => updateUserAddress(supabase, addressId, address),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useDeleteUserAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ addressId, userId }: { addressId: string; userId: string }) =>
      deleteUserAddress(supabase, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ addressId, userId }: { addressId: string; userId: string }) =>
      setDefaultAddress(supabase, addressId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useDistrictSearch(searchQuery: string) {
  return useQuery({
    queryKey: ['districts-search', searchQuery],
    queryFn: () => searchDistricts(supabase, searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useShippingRates(zoneId: string | null, weightGram: number) {
  return useQuery({
    queryKey: ['shipping-rates', zoneId, weightGram],
    queryFn: () => calculateShippingRates(supabase, zoneId!, weightGram),
    enabled: !!zoneId && weightGram > 0,
  })
}
