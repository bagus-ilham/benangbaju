import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetShippingZones,
  adminCreateShippingZone,
  adminUpdateShippingZone,
  adminDeleteShippingZone,
  adminGetShippingRates,
  adminCreateShippingRate,
  adminUpdateShippingRate,
  adminDeleteShippingRate,
} from '@/services/shipping'
import { ShippingZone, ShippingRate } from '@/modules/shipping/domain/shipping.types'

export function useAdminShippingZones() {
  return useQuery({
    queryKey: ['admin', 'shipping-zones'],
    queryFn: () => adminGetShippingZones(getAdminSupabase())
  })
}

export function useAdminCreateShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ zone, provinces }: { zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>; provinces: string[] }) =>
      adminCreateShippingZone(getAdminSupabase(), zone, provinces),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-zones'])
    }
  })
}

export function useAdminUpdateShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ zoneId, zone, provinces }: { zoneId: string; zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>; provinces?: string[] }) =>
      adminUpdateShippingZone(getAdminSupabase(), zoneId, zone, provinces),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-zones'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] }) // Invalidate calculation cache too
    }
  })
}

export function useAdminDeleteShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (zoneId: string) => adminDeleteShippingZone(getAdminSupabase(), zoneId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-zones', 'shipping-rates'])
    }
  })
}

export function useAdminShippingRates() {
  return useQuery({
    queryKey: ['admin', 'shipping-rates'],
    queryFn: () => adminGetShippingRates(getAdminSupabase())
  })
}

export function useAdminCreateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rate: Omit<ShippingRate, 'id' | 'shipping_zones'>) => adminCreateShippingRate(getAdminSupabase(), rate),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-rates'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}

export function useAdminUpdateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rateId, rate }: { rateId: string; rate: Partial<Omit<ShippingRate, 'id' | 'shipping_zones'>> }) =>
      adminUpdateShippingRate(getAdminSupabase(), rateId, rate),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-rates'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}

export function useAdminDeleteShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rateId: string) => adminDeleteShippingRate(getAdminSupabase(), rateId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['shipping-rates'])
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}
