export interface ProductVariantPayload {
  id?: string
  sku: string
  name: string
  price: number
  compare_price: number | null
  stock: number
  weight_gram: number | null
  is_active: boolean
  attrs: Array<{ attr_name: string; attr_value: string }>
}

export interface ProductImagePayload {
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  variant_id: string | null
}

export interface ProductLinkPayload {
  platform: string
  url: string
  label: string | null
  sort_order: number
}

export interface ProductPayload {
  productData: {
    category_id: string
    name: string
    slug: string
    description: string | null
    short_description: string | null
    weight_gram: number
    is_active: boolean
    is_featured: boolean
    meta_title: string | null
    meta_description: string | null
  }
  variants: ProductVariantPayload[]
  images: ProductImagePayload[]
  links: ProductLinkPayload[]
  collectionIds: string[]
}
