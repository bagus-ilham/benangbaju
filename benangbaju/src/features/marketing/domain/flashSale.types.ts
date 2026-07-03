export interface FlashSaleItemDetail {
  id: string
  flash_sale_id: string
  variant_id: string
  original_price: number
  sale_price: number
  discount_percent: number
  quota: number
  sold_count: number
  product_variants: {
    id: string
    sku: string
    name: string
    price: number
    stock: number
    products: {
      id: string
      name: string
      slug: string
      product_images: {
        url: string
        alt_text: string | null
        is_primary: boolean
      }[]
    }
  }
}

export interface FlashSaleDetail {
  id: string
  name: string
  description: string | null
  banner_url: string | null
  starts_at: string
  ends_at: string
  is_active: boolean
  flash_sale_items: FlashSaleItemDetail[]
}

export interface AdminFlashSaleListItem {
  id: string
  name: string
  description: string | null
  banner_url: string | null
  starts_at: string
  ends_at: string
  is_active: boolean
  flash_sale_items: Array<{
    id: string
    variant_id: string
    original_price: number
    sale_price: number
    quota: number
    sold_count: number
    product_variants: {
      name: string
      products: {
        name: string
      } | null
    } | null
  }>
}
