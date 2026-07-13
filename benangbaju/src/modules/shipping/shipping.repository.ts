import { isObject } from '@/lib/utils/validation'
import { createServerClient } from '@/lib/supabase/server'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UserAddress, District, ShippingOption, ShippingZone, ShippingRate } from './types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ShippingRepository {
  async getUserAddresses(userId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .select(
        'id, user_id, label, recipient_name, phone, province_name, city_name, district_name, postal_code, full_address, zone_id, is_default, created_at'
      )
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async addUserAddress(address: Omit<UserAddress, 'id' | 'created_at'>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .insert([address])
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateUserAddress(
    addressId: string,
    userId: string,
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  ) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .update(address)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteUserAddress(addressId: string, userId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)
    if (error) throw error
  }

  async setDefaultAddress(addressId: string, userId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)
    if (error) throw error
  }

  async searchDistricts(searchQuery: string) {
    const supabase = await createServerClient()
    const escapedQuery = searchQuery
      .trim()
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/,/g, '\\,')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
    const formattedQuery = `%${escapedQuery}%`

    const { data, error } = await supabase
      .from('districts')
      .select('id, province_name, city_name, district_name, postal_code, zone_id')
      .or(`district_name.ilike.${formattedQuery},city_name.ilike.${formattedQuery}`)
      .limit(15)

    if (error) throw error
    return data
  }

  async calculateShippingRates(zoneId: string, weightGram: number) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('calculate_shipping', {
      p_zone_id: zoneId,
      p_weight_gram: weightGram,
    })
    if (error) throw error
    return data
  }

  async adminGetShippingZones(page = 1, limit = 20) {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('shipping_zones')
      .select('*, shipping_zone_coverage(province_name)', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to)

    if (error) throw error
    return { data, count }
  }

  async adminCreateShippingZone(
    zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>,
    provinces: string[]
  ) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('admin_create_shipping_zone', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_zone: zone as any,
      p_provinces: provinces,
    })
    if (error) throw error
    return data
  }

  async adminUpdateShippingZone(
    zoneId: string,
    zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>,
    provinces?: string[]
  ) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('admin_update_shipping_zone', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_zone_id: zoneId as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_zone: zone as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_provinces: provinces as any,
    })
    if (error) throw error
    return data
  }

  async adminDeleteShippingZone(zoneId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase.from('shipping_zones').delete().eq('id', zoneId)
    if (error) throw error
  }

  async adminGetShippingRates(page = 1, limit = 20) {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('shipping_rates')
      .select('*, shipping_zones(name)', { count: 'exact' })
      .order('courier_name', { ascending: true })
      .range(from, to)

    if (error) throw error
    return { data, count }
  }

  async adminCreateShippingRate(rate: Omit<ShippingRate, 'id'>) {
    const supabase = await createServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('shipping_rates')
      .insert([rate as any])
      .select()
      .single()
    if (error) throw error
    return data
  }

  async adminUpdateShippingRate(rateId: string, rate: Partial<Omit<ShippingRate, 'id'>>) {
    const supabase = await createServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('shipping_rates')
      .update(rate as any)
      .eq('id', rateId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async adminDeleteShippingRate(rateId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase.from('shipping_rates').delete().eq('id', rateId)
    if (error) throw error
  }
}

export const shippingRepository = new ShippingRepository()
