import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/services/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { UserAddress, District, ShippingOption, ShippingZone, ShippingRate } from "../domain/shipping.types";
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

// 1. Fetch user addresses
export async function getUserAddresses(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ApiResponse<UserAddress[]>> {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('id, user_id, label, recipient_name, phone, province_name, city_name, district_name, postal_code, full_address, zone_id, is_default, created_at')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    safeLogError('Error fetching user addresses:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil alamat pengguna')
  }

  if (!data) return ok([])

  return ok(data.map(row => ({
    id: row.id,
    user_id: row.user_id,
    label: row.label,
    recipient_name: row.recipient_name,
    phone: row.phone,
    province_name: row.province_name,
    city_name: row.city_name,
    district_name: row.district_name,
    postal_code: row.postal_code,
    full_address: row.full_address,
    zone_id: row.zone_id,
    is_default: row.is_default,
    created_at: row.created_at,
  })))
}

// 2. Add user address
export async function addUserAddress(
  supabase: SupabaseClient<Database>,
  address: Omit<UserAddress, 'id' | 'created_at'>
): Promise<ApiResponse<UserAddress>> {
  const { data, error } = await supabase
    .from('user_addresses')
    .insert([address])
    .select()
    .single()

  if (error) {
    safeLogError('Error adding user address:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menambahkan alamat.')
  }

  return ok({
    id: data.id,
    user_id: data.user_id,
    label: data.label,
    recipient_name: data.recipient_name,
    phone: data.phone,
    province_name: data.province_name,
    city_name: data.city_name,
    district_name: data.district_name,
    postal_code: data.postal_code,
    full_address: data.full_address,
    zone_id: data.zone_id,
    is_default: data.is_default,
    created_at: data.created_at,
  })
}

// 3. Update user address
export async function updateUserAddress(
  supabase: SupabaseClient<Database>,
  addressId: string,
  userId: string,
  address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
): Promise<ApiResponse<UserAddress>> {
  const { data, error } = await supabase
    .from('user_addresses')
    .update(address)
    .eq('id', addressId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    safeLogError('Error updating user address:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui alamat.')
  }

  return ok({
    id: data.id,
    user_id: data.user_id,
    label: data.label,
    recipient_name: data.recipient_name,
    phone: data.phone,
    province_name: data.province_name,
    city_name: data.city_name,
    district_name: data.district_name,
    postal_code: data.postal_code,
    full_address: data.full_address,
    zone_id: data.zone_id,
    is_default: data.is_default,
    created_at: data.created_at,
  })
}

// 4. Delete user address
export async function deleteUserAddress(
  supabase: SupabaseClient<Database>,
  addressId: string,
  userId: string
): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId)

  if (error) {
    safeLogError('Error deleting user address:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus alamat.')
  }

  return ok()
}

// 5. Set default address
export async function setDefaultAddress(
  supabase: SupabaseClient<Database>,
  addressId: string,
  userId: string
): Promise<ApiResponse<void>> {
  // Directly update is_default to true.
  // The database trigger will automatically reset other default addresses.
  const { error } = await supabase
    .from('user_addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', userId)

  if (error) {
    safeLogError('Error setting default address:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengatur alamat utama.')
  }

  return ok()
}

// 6. Autocomplete search districts (kecamatan)
export async function searchDistricts(
  supabase: SupabaseClient<Database>,
  searchQuery: string
): Promise<ApiResponse<District[]>> {
  if (!searchQuery || searchQuery.trim().length < 2) return ok([])

  const escapedQuery = searchQuery.trim()
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

  if (error) {
    safeLogError('Error searching districts:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mencari kecamatan')
  }

  if (!data) return ok([])

  return ok(data.map(row => ({
    id: row.id,
    province_name: row.province_name,
    city_name: row.city_name,
    district_name: row.district_name,
    postal_code: row.postal_code,
    zone_id: row.zone_id,
  })))
}

// 7. Calculate shipping rates options
export async function calculateShippingRates(
  supabase: SupabaseClient<Database>,
  zoneId: string,
  weightGram: number
): Promise<ApiResponse<ShippingOption[]>> {
  const { data, error } = await supabase.rpc('calculate_shipping', {
    p_zone_id: zoneId,
    p_weight_gram: weightGram,
  })

  if (error) {
    safeLogError('Error calculating shipping:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghitung ongkos kirim. Silakan coba lagi.')
  }

  if (data && isObject(data)) {
    const success = typeof data['success'] === 'boolean' ? data['success'] : false
    const message = typeof data['message'] === 'string' ? data['message'] : undefined
    const rawOptions = data['data']
    
    if (!success) {
      return fail(ApiErrorCode.VALIDATION_ERROR, message || 'Gagal menghitung ongkos kirim')
    }
    
    const optionsList = Array.isArray(rawOptions) ? rawOptions : []
    const options: ShippingOption[] = []

    for (const opt of optionsList) {
      if (opt && isObject(opt)) {
        options.push({
          id: typeof opt['id'] === 'string' ? opt['id'] : '',
          courier_name: typeof opt['courier_name'] === 'string' ? opt['courier_name'] : '',
          price: typeof opt['price'] === 'number' ? opt['price'] : 0,
          etd_min: typeof opt['etd_min'] === 'number' ? opt['etd_min'] : 0,
          etd_max: typeof opt['etd_max'] === 'number' ? opt['etd_max'] : 0,
          weight_used_gram: typeof opt['weight_used_gram'] === 'number' ? opt['weight_used_gram'] : 0,
        })
      }
    }

    return ok(options)
  }

  return fail(ApiErrorCode.INTERNAL_ERROR, 'Respon dari sistem pengiriman tidak valid.')
}

// =============================================================
// ADMIN CRUD METHODS
// =============================================================
// 8. Get all shipping zones with coverage
export async function adminGetShippingZones(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<ShippingZone>> {
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await supabase
    .from('shipping_zones')
    .select('*, shipping_zone_coverage(province_name)', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (error) {
    safeLogError('Error fetching admin shipping zones:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar zona pengiriman')
  }

  if (!data) return paginated([], page, limit, count || 0)

  const result = data.map(row => {
    const rawCoverage = row.shipping_zone_coverage
    const coverageList = Array.isArray(rawCoverage) ? rawCoverage : []
    const shipping_zone_coverage = coverageList.map(c => ({
      province_name: c.province_name,
    }))
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      is_active: row.is_active,
      shipping_zone_coverage,
    }
  })
  
  return paginated(result, page, limit, count || 0)
}

// 9. Create shipping zone
export async function adminCreateShippingZone(
  supabase: SupabaseClient<Database>,
  zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>,
  provinces: string[]
): Promise<ApiResponse<ShippingZone>> {
  const { data: result, error: rpcErr } = await supabase.rpc('admin_create_shipping_zone', {
    p_zone: zone as any,
    p_provinces: provinces
  })

  if (rpcErr) {
    safeLogError('Error creating shipping zone (RPC):', rpcErr)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat zona pengiriman')
  }

  const res = result as any
  if (res && res.success === false) {
    safeLogError('Error creating shipping zone (RPC transaction):', res.error)
    return fail(ApiErrorCode.INTERNAL_ERROR, res.error?.message || 'Transaction failed')
  }

  const newZone = res?.data
  await insertAdminActivityLog(supabase, 'create', 'shipping_zone', newZone.id, `Created shipping zone ${newZone.name}`)

  return ok(newZone)
}

// 10. Update shipping zone
export async function adminUpdateShippingZone(
  supabase: SupabaseClient<Database>,
  zoneId: string,
  zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>,
  provinces?: string[]
): Promise<ApiResponse<void>> {
  const { data: result, error: rpcErr } = await supabase.rpc('admin_update_shipping_zone', {
    p_zone_id: zoneId as any,
    p_zone: zone as any,
    p_provinces: provinces as any
  })

  if (rpcErr) {
    safeLogError('Error updating shipping zone (RPC):', rpcErr)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui zona pengiriman')
  }

  const res = result as any
  if (res && res.success === false) {
    safeLogError('Error updating shipping zone (RPC transaction):', res.error)
    return fail(ApiErrorCode.INTERNAL_ERROR, res.error?.message || 'Transaction failed')
  }

  await insertAdminActivityLog(supabase, 'update', 'shipping_zone', zoneId, `Updated shipping zone ${zone.name || zoneId}`)

  return ok()
}

// 11. Delete shipping zone
export async function adminDeleteShippingZone(
  supabase: SupabaseClient<Database>,
  zoneId: string
): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('shipping_zones')
    .delete()
    .eq('id', zoneId)

  if (error) {
    safeLogError('Error deleting shipping zone:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus zona pengiriman')
  }

  await insertAdminActivityLog(supabase, 'delete', 'shipping_zone', zoneId, `Deleted shipping zone ${zoneId}`)
  return ok()
}

// 12. Get all shipping rates
export async function adminGetShippingRates(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<ShippingRate>> {
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await supabase
    .from('shipping_rates')
    .select('*, shipping_zones(name)', { count: 'exact' })
    .order('courier_name', { ascending: true })
    .range(from, to)

  if (error) {
    safeLogError('Error fetching admin shipping rates:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar tarif pengiriman')
  }

  if (!data) return paginated([], page, limit, count || 0)

  const result = data.map(row => {
    const rawZones = row.shipping_zones
    let shipping_zones: { name: string } | null = null
    if (rawZones && !Array.isArray(rawZones)) {
      shipping_zones = {
        name: rawZones.name,
      }
    }
    return {
      id: row.id,
      zone_id: row.zone_id,
      courier_name: row.courier_name,
      price_per_kg: row.price_per_kg,
      min_weight_gram: row.min_weight_gram,
      base_price: row.base_price,
      etd_days_min: row.etd_days_min,
      etd_days_max: row.etd_days_max,
      is_active: row.is_active,
      shipping_zones,
    }
  })
  
  return paginated(result, page, limit, count || 0)
}

// 13. Create shipping rate
export async function adminCreateShippingRate(
  supabase: SupabaseClient<Database>,
  rate: Omit<ShippingRate, 'id' | 'shipping_zones'>
): Promise<ApiResponse<ShippingRate>> {
  const { data, error } = await supabase
    .from('shipping_rates')
    .insert([rate])
    .select()
    .single()

  if (error) {
    safeLogError('Error creating shipping rate:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat tarif pengiriman')
  }

  const result = {
    id: data.id,
    zone_id: data.zone_id,
    courier_name: data.courier_name,
    price_per_kg: data.price_per_kg,
    min_weight_gram: data.min_weight_gram,
    base_price: data.base_price,
    etd_days_min: data.etd_days_min,
    etd_days_max: data.etd_days_max,
    is_active: data.is_active,
  }

  await insertAdminActivityLog(supabase, 'create', 'shipping_rate', data.id, `Created shipping rate for courier ${data.courier_name}`)

  return ok(result)
}

// 14. Update shipping rate
export async function adminUpdateShippingRate(
  supabase: SupabaseClient<Database>,
  rateId: string,
  rate: Partial<Omit<ShippingRate, 'id' | 'shipping_zones'>>
): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('shipping_rates')
    .update(rate)
    .eq('id', rateId)

  if (error) {
    safeLogError('Error updating shipping rate:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui tarif pengiriman')
  }

  await insertAdminActivityLog(supabase, 'update', 'shipping_rate', rateId, `Updated shipping rate ${rateId}`)
  return ok()
}

// 15. Delete shipping rate
export async function adminDeleteShippingRate(
  supabase: SupabaseClient<Database>,
  rateId: string
): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('shipping_rates')
    .delete()
    .eq('id', rateId)

  if (error) {
    safeLogError('Error deleting shipping rate:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus tarif pengiriman')
  }

  await insertAdminActivityLog(supabase, 'delete', 'shipping_rate', rateId, `Deleted shipping rate ${rateId}`)
  return ok()
}
