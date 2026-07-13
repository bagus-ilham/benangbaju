export interface LocalCartItem {
  id?: string
  variantId: string
  productName: string
  variantName: string
  name: string
  sku: string
  price: number
  comparePrice: number | null
  quantity: number
  imageUrl: string | null
  slug: string
  stock: number
}
