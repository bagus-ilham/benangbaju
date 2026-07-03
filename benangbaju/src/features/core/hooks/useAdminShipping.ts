import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetShippingZones,
  adminCreateShippingZone,
  adminUpdateShippingZone,
  adminDeleteShippingZone,
  adminGetShippingRates,
  adminCreateShippingRate,
  adminUpdateShippingRate,
  adminDeleteShippingRate,
} from '@/entities/shipping/lib/shipping'
import { ShippingZone, ShippingRate } from '@/features/core/domain/shipping.types'

import { ApiListResponse } from '@/lib/api-response'

export function useAdminShippingZones(
  page = 1,
  limit = 20
): import('@tanstack/react-query').UseQueryResult<ApiListResponse<ShippingZone>, Error> {
  return useQuery({
    queryKey: ['admin', 'shipping-zones', page, limit],
    queryFn: () => adminGetShippingZones(getAdminSupabase(), page, limit),
  })
}

export function useAdminCreateShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      zone,
      provinces,
    }: {
      zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>
      provinces: string[]
    }) => {
      const res = await adminCreateShippingZone(getAdminSupabase(), zone, provinces)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat zona pengiriman')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-zones'])
    },
  })
}

export function useAdminUpdateShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      zoneId,
      zone,
      provinces,
    }: {
      zoneId: string
      zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>
      provinces?: string[]
    }) => {
      const res = await adminUpdateShippingZone(getAdminSupabase(), zoneId, zone, provinces)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui zona pengiriman')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-zones'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] }) // Invalidate calculation cache too
    },
  })
}

export function useAdminDeleteShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (zoneId: string) => {
      const res = await adminDeleteShippingZone(getAdminSupabase(), zoneId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus zona pengiriman')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-zones', 'shipping-rates'])
    },
  })
}

export function useAdminShippingRates(
  page = 1,
  limit = 20
): import('@tanstack/react-query').UseQueryResult<ApiListResponse<ShippingRate>, Error> {
  return useQuery({
    queryKey: ['admin', 'shipping-rates', page, limit],
    queryFn: () => adminGetShippingRates(getAdminSupabase(), page, limit),
  })
}

export function useAdminCreateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rate: Omit<ShippingRate, 'id' | 'shipping_zones'>) => {
      const res = await adminCreateShippingRate(getAdminSupabase(), rate)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat tarif pengiriman')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-rates'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    },
  })
}

export function useAdminUpdateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      rateId,
      rate,
    }: {
      rateId: string
      rate: Partial<Omit<ShippingRate, 'id' | 'shipping_zones'>>
    }) => {
      const res = await adminUpdateShippingRate(getAdminSupabase(), rateId, rate)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui tarif pengiriman')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-rates'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    },
  })
}

export function useAdminDeleteShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rateId: string) => {
      const res = await adminDeleteShippingRate(getAdminSupabase(), rateId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus tarif pengiriman')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-rates'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    },
  })
}
