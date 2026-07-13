export interface ProductFilters {
  categorySlug?: string
  collectionSlug?: string
  searchQuery?: string
  productIds?: string[]
  minPrice?: number
  maxPrice?: number
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'popular' | 'featured'
  page?: number
  limit?: number
}

export interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  compare_price: number | null
  stock: number
  weight_gram: number | null
  is_active: boolean
  product_variant_attrs?: {
    id: string
    attr_name: string
    attr_value: string
  }[]
}

export interface ProductImage {
  id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  variant_id?: string | null
}

export interface ProductMarketplaceLink {
  id: string
  platform: string
  url: string
  label: string | null
}

export interface ProductRatingSummary {
  avg_rating: number
  total_reviews: number
}

export interface ProductListItem {
  id: string
  category_id: string
  name: string
  slug: string
  is_featured: boolean
  created_at: string
  categories: {
    name: string
    slug: string
  } | null
  product_variants: ProductVariant[]
  product_images: ProductImage[]

  // Pre-computed fields for performance
  minPrice: number
  maxPrice: number
  comparePrice: number | null
  discountPercent: number | null
  primaryImage: string | null
  hoverImage: string | null
  hasMultipleColors: boolean
  sizeVariants: ProductVariant[]
}

export interface ProductDetailItem extends Omit<
  ProductListItem,
  | 'minPrice'
  | 'maxPrice'
  | 'comparePrice'
  | 'discountPercent'
  | 'primaryImage'
  | 'hoverImage'
  | 'hasMultipleColors'
  | 'sizeVariants'
> {
  description: string | null
  short_description: string | null
  meta_title: string | null
  meta_description: string | null
  weight_gram: number
  product_marketplace_links: ProductMarketplaceLink[]
  product_rating_summary: ProductRatingSummary | null
  size_guide: string | null
  care_guide: string | null
}

export interface AdminProductListItem {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  weight_gram: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  categories: {
    name: string
    slug: string
  } | null
  product_variants: Array<{
    id: string
    sku: string
    name: string
    price: number
    compare_price: number | null
    stock: number
    is_active: boolean
  }>
}
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
  id?: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  variant_id: string | null
}

export interface ProductLinkPayload {
  id?: string
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
    size_guide: string | null
    care_guide: string | null
  }
  variants: ProductVariantPayload[]
  images: ProductImagePayload[]
  links: ProductLinkPayload[]
  collectionIds: string[]
}
