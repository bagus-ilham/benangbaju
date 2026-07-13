import { ProductVariant, ProductImage, ProductListItem } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCategory(rawCat: any): { name: string; slug: string } | null {
  if (rawCat && !Array.isArray(rawCat)) {
    return { name: rawCat.name, slug: rawCat.slug }
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapVariants(rawVariants: any, includeAttrs = true): ProductVariant[] {
  const variantsList = Array.isArray(rawVariants) ? rawVariants : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return variantsList.map((v: any) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    price: v.price,
    compare_price: v.compare_price,
    stock: v.stock,
    weight_gram: v.weight_gram || null,
    is_active: v.is_active,
    ...(includeAttrs && {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      product_variant_attrs: (v.product_variant_attrs || []).map((attr: any) => ({
        id: attr.id,
        attr_name: attr.attr_name,
        attr_value: attr.attr_value,
      })),
    }),
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapImages(rawImages: any): ProductImage[] {
  const imagesList = Array.isArray(rawImages) ? rawImages : []
  return (
    imagesList
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((img: any) => ({
        id: img.id,
        url: img.url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        variant_id: img.variant_id,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProductListItem(p: any): ProductListItem {
  const categories = mapCategory(p.categories)
  const product_variants = mapVariants(p.product_variants)
  const product_images = mapImages(p.product_images)

  let minPrice = 0
  let maxPrice = 0
  let minPriceVariant = null
  let activeVariantsCount = 0

  for (let i = 0; i < product_variants.length; i++) {
    const v = product_variants[i]
    if (v.is_active) {
      activeVariantsCount++
      const price = Number(v.price)
      if (activeVariantsCount === 1) {
        minPrice = price
        maxPrice = price
        minPriceVariant = v
      } else {
        if (price < minPrice) {
          minPrice = price
          minPriceVariant = v
        }
        if (price > maxPrice) {
          maxPrice = price
        }
      }
    }
  }

  const comparePrice = minPriceVariant?.compare_price ? Number(minPriceVariant.compare_price) : null
  const discountPercent =
    comparePrice && comparePrice > minPrice
      ? Math.round(((comparePrice - minPrice) / comparePrice) * 100)
      : null

  let primaryImage = null
  let hoverImage = null
  let foundPrimary = false
  let foundHover = false

  for (let i = 0; i < product_images.length; i++) {
    const img = product_images[i]
    if (img.is_primary && !foundPrimary) {
      primaryImage = img.url
      foundPrimary = true
    } else if (!img.is_primary && img.sort_order > 0 && !foundHover) {
      hoverImage = img.url
      foundHover = true
    }
  }

  if (!primaryImage && product_images.length > 0) primaryImage = product_images[0].url
  if (!hoverImage && product_images.length > 1) hoverImage = product_images[1].url
  if (!hoverImage) hoverImage = primaryImage

  let hasMultipleColors = false
  const colorSet = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sizeVariants: any[] = []

  for (let i = 0; i < product_variants.length; i++) {
    const v = product_variants[i]
    if (!v.is_active) continue

    let hasSize = false
    if (v.product_variant_attrs) {
      for (let j = 0; j < v.product_variant_attrs.length; j++) {
        const attr = v.product_variant_attrs[j]
        const nameLower = attr.attr_name.toLowerCase()
        if (nameLower.includes('warna')) {
          colorSet.add(attr.attr_value)
          if (colorSet.size > 1) hasMultipleColors = true
        } else if (nameLower.includes('ukuran')) {
          hasSize = true
        }
      }
    }

    if (hasSize && v.stock > 0) {
      sizeVariants.push(v)
    }
  }

  return {
    id: p.id,
    category_id: p.category_id,
    name: p.name,
    slug: p.slug,
    is_featured: p.is_featured,
    created_at: p.created_at,
    categories,
    product_variants,
    product_images,
    minPrice,
    maxPrice,
    comparePrice,
    discountPercent,
    primaryImage,
    hoverImage,
    hasMultipleColors,
    sizeVariants,
  }
}
