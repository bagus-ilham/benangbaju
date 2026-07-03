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
} from '@/entities/shipping/lib/shipping'
import { ApiResponse } from '@/lib/api-response'

export function useUserAddresses(userId: string) : import("@tanstack/react-query").UseQueryResult<ApiResponse<UserAddress[]>, Error> {
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
    mutationFn: async (address: Omit<UserAddress, 'id' | 'created_at'>) => {
      const res = await addUserAddress(supabase, address)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menambahkan alamat')
      return res
    },
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
    mutationFn: async ({
      addressId,
      userId,
      address,
    }: {
      addressId: string
      userId: string
      address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
    }) => {
      const res = await updateUserAddress(supabase, addressId, userId, address)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui alamat')
      return res
    },
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
    mutationFn: async ({ addressId, userId }: { addressId: string; userId: string }) => {
      const res = await deleteUserAddress(supabase, addressId, userId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus alamat')
      return res
    },
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
    mutationFn: async ({ addressId, userId }: { addressId: string; userId: string }) => {
      const res = await setDefaultAddress(supabase, addressId, userId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengatur alamat utama')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useDistrictSearch(searchQuery: string) : import("@tanstack/react-query").UseQueryResult<ApiResponse<import("@/entities/shipping/lib/shipping").District[]>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['districts-search', searchQuery],
    queryFn: () => searchDistricts(supabase, searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useShippingRates(zoneId: string | null, weightGram: number) : import("@tanstack/react-query").UseQueryResult<ApiResponse<import("@/entities/shipping/lib/shipping").ShippingOption[]>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['shipping-rates', zoneId, weightGram],
    queryFn: () => calculateShippingRates(supabase, zoneId!, weightGram),
    enabled: !!zoneId && weightGram > 0,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  })
}
