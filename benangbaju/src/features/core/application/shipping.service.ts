import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import * as repo from '../infrastructure/shipping.repository'
import { UserAddress, ShippingZone, ShippingRate } from '../domain/shipping.types'

export class ShippingService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getUserAddresses(userId: string) {
    return repo.getUserAddresses(this.supabase, userId)
  }

  async addUserAddress(address: Omit<UserAddress, 'id' | 'created_at'>) {
    return repo.addUserAddress(this.supabase, address)
  }

  async updateUserAddress(
    addressId: string,
    userId: string,
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  ) {
    return repo.updateUserAddress(this.supabase, addressId, userId, address)
  }

  async deleteUserAddress(addressId: string, userId: string) {
    return repo.deleteUserAddress(this.supabase, addressId, userId)
  }

  async setDefaultAddress(addressId: string, userId: string) {
    return repo.setDefaultAddress(this.supabase, addressId, userId)
  }

  async searchDistricts(searchQuery: string) {
    return repo.searchDistricts(this.supabase, searchQuery)
  }

  async calculateShippingRates(zoneId: string, weightGram: number) {
    return repo.calculateShippingRates(this.supabase, zoneId, weightGram)
  }

  async adminGetShippingZones(page = 1, limit = 20) {
    return repo.adminGetShippingZones(this.supabase, page, limit)
  }

  async adminCreateShippingZone(
    zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>,
    provinces: string[]
  ) {
    return repo.adminCreateShippingZone(this.supabase, zone, provinces)
  }

  async adminUpdateShippingZone(
    zoneId: string,
    zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>,
    provinces?: string[]
  ) {
    return repo.adminUpdateShippingZone(this.supabase, zoneId, zone, provinces)
  }

  async adminDeleteShippingZone(zoneId: string) {
    return repo.adminDeleteShippingZone(this.supabase, zoneId)
  }

  async adminGetShippingRates(page = 1, limit = 20) {
    return repo.adminGetShippingRates(this.supabase, page, limit)
  }

  async adminCreateShippingRate(rate: Omit<ShippingRate, 'id' | 'shipping_zones'>) {
    return repo.adminCreateShippingRate(this.supabase, rate)
  }

  async adminUpdateShippingRate(
    rateId: string,
    rate: Partial<Omit<ShippingRate, 'id' | 'shipping_zones'>>
  ) {
    return repo.adminUpdateShippingRate(this.supabase, rateId, rate)
  }

  async adminDeleteShippingRate(rateId: string) {
    return repo.adminDeleteShippingRate(this.supabase, rateId)
  }
}
