import React from 'react'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getProductBySlug, getRelatedProducts } from '@/services/products'
import { ProductDetailClient } from './ProductDetailClient'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Fetch product detail on the server
  const product = await getProductBySlug(supabase, slug)

  if (!product) {
    notFound()
  }

  // Fetch related products from the same category
  const relatedProducts = product.categories
    ? await getRelatedProducts(supabase, product.id, product.category_id, 4)
    : []

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  )
}
