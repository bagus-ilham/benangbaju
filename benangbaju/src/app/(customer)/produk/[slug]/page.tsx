import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getProductBySlug, getRelatedProducts } from '@/services/products'
import { ProductDetailClient } from './ProductDetailClient'
import { RelatedProducts } from './RelatedProducts'

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

async function RelatedProductsServer({ productId, categoryId }: { productId: string, categoryId: string }) {
  const relatedProducts = await getCachedRelatedProducts(productId, categoryId)
  return <RelatedProducts products={relatedProducts} />
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase.from('products').select('slug').eq('is_active', true)
  return (data || []).map((p) => ({ slug: p.slug }))
}

export default async function ProductDetailPage({ params }: ProductPageProps) : Promise<React.JSX.Element> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  // Fetch product detail on the server (awaited because it is required for first paint)
  let product
  try {
    product = await getCachedProduct(slug)
  } catch (err) {
    notFound()
  }

  const hasRelated = product.categories && product.category_id
  
  const relatedNode = hasRelated ? (
    <Suspense fallback={
      <div className="py-12 border-t border-neutral-100">
        <div className="h-8 w-48 bg-neutral-100 mx-auto mb-8 skeleton-shimmer rounded-md" />
        <div className="flex md:grid md:grid-cols-4 gap-x-4">
          <div className="w-[45vw] sm:w-[35vw] md:w-auto aspect-[3/4] bg-neutral-50 skeleton-shimmer rounded-xl" />
          <div className="w-[45vw] sm:w-[35vw] md:w-auto aspect-[3/4] bg-neutral-50 skeleton-shimmer rounded-xl" />
          <div className="hidden md:block w-auto aspect-[3/4] bg-neutral-50 skeleton-shimmer rounded-xl" />
          <div className="hidden md:block w-auto aspect-[3/4] bg-neutral-50 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    }>
      <RelatedProductsServer productId={product.id} categoryId={product.category_id} />
    </Suspense>
  ) : null

  return (
    <ProductDetailClient
      product={product}
      relatedProductsNode={relatedNode}
    />
  )
}
