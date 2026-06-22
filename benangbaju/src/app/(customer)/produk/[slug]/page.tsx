import React from 'react'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getProductBySlug, getRelatedProducts } from '@/services/products'
import { ProductDetailClient } from './ProductDetailClient'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCachedProduct(slug: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('products', `product-${slug}`)

  const supabase = createStaticClient()
  const product = await getProductBySlug(supabase, slug)
  if (!product) {
    throw new Error(`Product ${slug} not found`)
  }
  return product
}

async function getCachedRelatedProducts(productId: string, categoryId: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('products')

  const supabase = createStaticClient()
  return getRelatedProducts(supabase, productId, categoryId, 4)
}

export default async function ProductDetailPage({ params }: ProductPageProps) : Promise<React.JSX.Element> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  // Fetch product detail on the server
  let product
  try {
    product = await getCachedProduct(slug)
  } catch (err) {
    notFound()
  }

  // Fetch related products from the same category
  const relatedProducts = product.categories && product.category_id
    ? await getCachedRelatedProducts(product.id, product.category_id)
    : []

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  )
}
