import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query'
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

export function useUserAddresses(userId: string) : import("@tanstack/react-query").UseQueryResult<UserAddress[], Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => getUserAddresses(supabase, userId),
    enabled: !!userId,
  })
}

export function useAddUserAddress() : UseMutationResult<
  Awaited<ReturnType<typeof addUserAddress>>,
  Error,
  Omit<UserAddress, 'id' | 'created_at'>,
  unknown
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: (address: Omit<UserAddress, 'id' | 'created_at'>) =>
      addUserAddress(supabase, address),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.user_id] })
    },
  })
}

export function useUpdateUserAddress() : UseMutationResult<
  Awaited<ReturnType<typeof updateUserAddress>>,
  Error,
  {
    addressId: string
    userId: string
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  },
  unknown
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: ({
      addressId,
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

export function useDeleteUserAddress() : UseMutationResult<
  Awaited<ReturnType<typeof deleteUserAddress>>,
  Error,
  { addressId: string; userId: string },
  unknown
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: ({ addressId }: { addressId: string; userId: string }) =>
      deleteUserAddress(supabase, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useSetDefaultAddress() : UseMutationResult<
  Awaited<ReturnType<typeof setDefaultAddress>>,
  Error,
  { addressId: string; userId: string },
  unknown
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: ({ addressId, userId }: { addressId: string; userId: string }) =>
      setDefaultAddress(supabase, addressId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useDistrictSearch(searchQuery: string) : import("@tanstack/react-query").UseQueryResult<import("@/services/shipping").District[], Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['districts-search', searchQuery],
    queryFn: () => searchDistricts(supabase, searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useShippingRates(zoneId: string | null, weightGram: number) : import("@tanstack/react-query").UseQueryResult<import("@/services/shipping").ShippingCalculationResult, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['shipping-rates', zoneId, weightGram],
    queryFn: () => calculateShippingRates(supabase, zoneId!, weightGram),
    enabled: !!zoneId && weightGram > 0,
  })
}
