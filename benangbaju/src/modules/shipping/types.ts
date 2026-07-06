export interface UserAddress {
  id: string
  user_id: string
  label: string
  recipient_name: string
  phone: string
  province_name: string
  city_name: string
  district_name: string
  postal_code: string
  full_address: string
  zone_id: string | null
  is_default: boolean
  created_at: string
}

export interface District {
  id: string
  province_name: string
  city_name: string
  district_name: string
  postal_code: string | null
  zone_id: string | null
}

export interface ShippingOption {
  id: string
  courier_name: string
  price: number
  etd_min: number
  etd_max: number
  weight_used_gram: number
}

export interface ShippingCalculationResult {
  success: boolean
  message?: string
  data?: ShippingOption[]
}

export interface ShippingZone {
  id: string
  name: string
  description: string | null
  is_active: boolean
  shipping_zone_coverage?: { province_name: string }[]
}

export interface ShippingRate {
  id: string
  zone_id: string
  courier_name: string
  price_per_kg: number
  min_weight_gram: number
  base_price: number
  etd_days_min: number
  etd_days_max: number
  is_active: boolean
  shipping_zones?: { name: string } | null
}
