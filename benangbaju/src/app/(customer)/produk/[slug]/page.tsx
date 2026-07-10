import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { productService } from '@/modules/products/product.service'
import { ProductDetailClient } from './ProductDetailClient'
import { RelatedProducts } from './RelatedProducts'
import { ProductGridSkeleton } from '@/shared/components'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCachedProduct(slug: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('products', `product-${slug}`)

  const res = await productService.getProductBySlug(slug)
  if (!res.success || !res.data) {
    throw new Error(`Product ${slug} not found`)
  }
  return res.data
}

async function getCachedRelatedProducts(productId: string, categoryId: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('products')

  const res = await productService.getRelatedProducts(productId, categoryId, 4)
  return res.success ? res.data : []
}

async function RelatedProductsServer({
  productId,
  categoryId,
}: {
  productId: string
  categoryId: string
}) {
  const relatedProducts = await getCachedRelatedProducts(productId, categoryId)
  return <RelatedProducts products={relatedProducts} />
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase.from('products').select('slug').eq('is_active', true)
  return (data || []).map((p) => ({ slug: p.slug }))
}

import { Metadata } from 'next'

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  try {
    const product = await getCachedProduct(slug)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'

    // Determine primary image
    let imageUrl = ''
    if (product.product_images && product.product_images.length > 0) {
      const primaryImg =
        product.product_images.find((img) => img.is_primary) || product.product_images[0]
      imageUrl = primaryImg.url
    }

    return {
      title: product.meta_title || `${product.name} | Benangbaju`,
      description:
        product.meta_description ||
        product.short_description ||
        product.description ||
        `Beli ${product.name} koleksi terbaik dari Benangbaju.`,
      openGraph: {
        title: product.meta_title || `${product.name} | Benangbaju`,
        description:
          product.meta_description ||
          product.short_description ||
          `Beli ${product.name} koleksi terbaik dari Benangbaju.`,
        url: `${baseUrl}/produk/${slug}`,
        images: imageUrl ? [{ url: imageUrl }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.meta_title || `${product.name} | Benangbaju`,
        description: product.meta_description || product.short_description || '',
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return {
      title: 'Produk Tidak Ditemukan | Benangbaju',
    }
  }
}

export default async function ProductDetailPage({
  params,
}: ProductPageProps): Promise<React.JSX.Element> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  // Fetch product detail on the server (awaited because it is required for first paint)
  let product
  try {
    product = await getCachedProduct(slug)
  } catch {
    notFound()
  }

  const hasRelated = product.categories && product.category_id

  const relatedNode = hasRelated ? (
    <Suspense
      fallback={
        <div className="py-12 border-t border-neutral-100">
          <div className="h-8 w-48 bg-neutral-100 mx-auto mb-8 skeleton-shimmer rounded-md" />
          <ProductGridSkeleton count={4} />
        </div>
      }
    >
      <RelatedProductsServer productId={product.id} categoryId={product.category_id} />
    </Suspense>
  ) : null

  // Generate JSON-LD
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'
  let primaryImageUrl = ''
  if (product.product_images && product.product_images.length > 0) {
    const primaryImg =
      product.product_images.find((img) => img.is_primary) || product.product_images[0]
    primaryImageUrl = primaryImg.url
  }

  // Find cheapest price for Offer
  let price = 0
  if (product.product_variants && product.product_variants.length > 0) {
    price = Math.min(...product.product_variants.map((v) => Number(v.price)))
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: primaryImageUrl ? [primaryImageUrl] : [],
    description:
      product.meta_description ||
      product.short_description ||
      product.description ||
      `Beli ${product.name} dari Benangbaju.`,
    sku: product.product_variants?.[0]?.sku || '',
    brand: {
      '@type': 'Brand',
      name: 'Benangbaju',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/produk/${slug}`,
      priceCurrency: 'IDR',
      price: price,
      availability: product.product_variants?.some((v) => v.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }

  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <ProductDetailClient product={product} relatedProductsNode={relatedNode} />
    </>
  )
}
