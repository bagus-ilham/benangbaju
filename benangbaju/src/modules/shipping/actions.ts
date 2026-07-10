'use server'

import { requireAuth, requireAdmin } from '@/lib/auth-guard'
import { shippingService } from './shipping.service'
import { adminShippingService } from './admin-shipping.service'
import { UserAddress, ShippingZone, ShippingRate } from './types'

export async function getUserAddressesAction(userId: string) {
  const { user } = await requireAuth()
  if (user.id !== userId) throw new Error('Unauthorized')
  return shippingService.getUserAddresses(userId)
}

export async function addUserAddressAction(address: Omit<UserAddress, 'id' | 'created_at'>) {
  const { user } = await requireAuth()
  if (user.id !== address.user_id) throw new Error('Unauthorized')
  return shippingService.addUserAddress(address)
}

export async function updateUserAddressAction(
  addressId: string,
  userId: string,
  address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
) {
  const { user } = await requireAuth()
  if (user.id !== userId) throw new Error('Unauthorized')
  return shippingService.updateUserAddress(addressId, userId, address)
}

export async function deleteUserAddressAction(addressId: string, userId: string) {
  const { user } = await requireAuth()
  if (user.id !== userId) throw new Error('Unauthorized')
  return shippingService.deleteUserAddress(addressId, userId)
}

export async function setDefaultAddressAction(addressId: string, userId: string) {
  const { user } = await requireAuth()
  if (user.id !== userId) throw new Error('Unauthorized')
  return shippingService.setDefaultAddress(addressId, userId)
}

export async function searchDistrictsAction(searchQuery: string) {
  return shippingService.searchDistricts(searchQuery)
}

export async function calculateShippingRatesAction(zoneId: string, weightGram: number) {
  return shippingService.calculateShippingRates(zoneId, weightGram)
}

// Admin Actions
export async function adminGetShippingZonesAction(page = 1, limit = 20) {
  await requireAdmin()
  return adminShippingService.getShippingZones(page, limit)
}

export async function adminCreateShippingZoneAction(
  zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>,
  provinces: string[]
) {
  await requireAdmin()
  return adminShippingService.createShippingZone(zone, provinces)
}

export async function adminUpdateShippingZoneAction(
  zoneId: string,
  zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>,
  provinces?: string[]
) {
  await requireAdmin()
  return adminShippingService.updateShippingZone(zoneId, zone, provinces)
}

export async function adminDeleteShippingZoneAction(zoneId: string) {
  await requireAdmin()
  return adminShippingService.deleteShippingZone(zoneId)
}

export async function adminGetShippingRatesAction(page = 1, limit = 20) {
  await requireAdmin()
  return adminShippingService.getShippingRates(page, limit)
}

export async function adminCreateShippingRateAction(rate: Omit<ShippingRate, 'id'>) {
  await requireAdmin()
  return adminShippingService.createShippingRate(rate)
}

export async function adminUpdateShippingRateAction(
  rateId: string,
  rate: Partial<Omit<ShippingRate, 'id'>>
) {
  await requireAdmin()
  return adminShippingService.updateShippingRate(rateId, rate)
}

export async function adminDeleteShippingRateAction(rateId: string) {
  await requireAdmin()
  return adminShippingService.deleteShippingRate(rateId)
}
