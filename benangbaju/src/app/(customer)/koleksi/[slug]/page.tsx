import React from 'react'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getCollectionBySlugAction } from '@/modules/collections/actions'
import { getProductsAction } from '@/modules/products/actions'
import { CollectionDetailClient } from './CollectionDetailClient'

interface CollectionPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCachedCollection(slug: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('collections', `collection-${slug}`)

  const res = await getCollectionBySlugAction(slug)
  const collection = res.data
  if (!res.success || !collection) {
    return null
  }
  return collection
}

async function getCachedCollectionProducts(slug: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('products', 'collections')

  return getProductsAction({
    collectionSlug: slug,
    limit: 40,
  })
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase.from('collections').select('slug').eq('is_active', true)
  return (data || []).map((c) => ({ slug: c.slug }))
}

export default async function CollectionDetailPage({
  params,
}: CollectionPageProps): Promise<React.JSX.Element> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  let collection
  let products

  try {
    const [colRes, prodRes] = await Promise.all([
      getCachedCollection(slug),
      getCachedCollectionProducts(slug),
    ])
    if (!colRes) {
      notFound()
    }
    collection = colRes
    products = prodRes.data || []
  } catch {
    notFound()
  }

  return <CollectionDetailClient collection={collection} products={products} />
}
