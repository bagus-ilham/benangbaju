export interface CustomerProfile {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  label: string
  recipient_name: string
  phone: string
  full_address: string
  province_name: string
  city_name: string
  district_name: string
  postal_code: string
  is_default: boolean
}

export interface CustomerCartItem {
  id: string
  quantity: number
  variant: {
    id: string
    name: string
    price: number
    sku: string
    product: {
      id: string
      name: string
      image_url: string | null
    } | null
  } | null
}

export interface CustomerWishlistItem {
  id: string
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
  } | null
}

export interface CustomerDetail extends CustomerProfile {
  addresses: CustomerAddress[]
  cart_items: CustomerCartItem[]
  wishlist_items: CustomerWishlistItem[]
}
