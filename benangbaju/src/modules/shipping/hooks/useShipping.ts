import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import {
  getUserAddressesAction,
  addUserAddressAction,
  updateUserAddressAction,
  deleteUserAddressAction,
  setDefaultAddressAction,
  searchDistrictsAction,
  calculateShippingRatesAction,
} from '@/modules/shipping/actions'
import { UserAddress, District, ShippingOption } from '@/modules/shipping/types'
import { ApiResponse } from '@/lib/api-response'

export function useUserAddresses(
  userId: string
): import('@tanstack/react-query').UseQueryResult<ApiResponse<UserAddress[]>, Error> {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => getUserAddressesAction(userId),
    enabled: !!userId,
  })
}

export function useAddUserAddress(): UseMutationResult<
  Awaited<ReturnType<typeof addUserAddressAction>>,
  Error,
  Omit<UserAddress, 'id' | 'created_at'>,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (address: Omit<UserAddress, 'id' | 'created_at'>) => {
      const res = await addUserAddressAction(address)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menambahkan alamat')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.user_id] })
    },
  })
}

export function useUpdateUserAddress(): UseMutationResult<
  Awaited<ReturnType<typeof updateUserAddressAction>>,
  Error,
  {
    addressId: string
    userId: string
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  },
  unknown
> {
  const queryClient = useQueryClient()
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
      const res = await updateUserAddressAction(addressId, userId, address)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui alamat')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useDeleteUserAddress(): UseMutationResult<
  Awaited<ReturnType<typeof deleteUserAddressAction>>,
  Error,
  { addressId: string; userId: string },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ addressId, userId }: { addressId: string; userId: string }) => {
      const res = await deleteUserAddressAction(addressId, userId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus alamat')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useSetDefaultAddress(): UseMutationResult<
  Awaited<ReturnType<typeof setDefaultAddressAction>>,
  Error,
  { addressId: string; userId: string },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ addressId, userId }: { addressId: string; userId: string }) => {
      const res = await setDefaultAddressAction(addressId, userId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengatur alamat utama')
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
    },
  })
}

export function useDistrictSearch(
  searchQuery: string
): import('@tanstack/react-query').UseQueryResult<ApiResponse<District[]>, Error> {
  return useQuery({
    queryKey: ['districts-search', searchQuery],
    queryFn: () => searchDistrictsAction(searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useShippingRates(
  zoneId: string | null,
  weightGram: number
): import('@tanstack/react-query').UseQueryResult<ApiResponse<ShippingOption[]>, Error> {
  return useQuery({
    queryKey: ['shipping-rates', zoneId, weightGram],
    queryFn: () => calculateShippingRatesAction(zoneId!, weightGram),
    enabled: !!zoneId && weightGram > 0,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  })
}
