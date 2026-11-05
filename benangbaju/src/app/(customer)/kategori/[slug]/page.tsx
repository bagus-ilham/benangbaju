import React from 'react'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getCategoryBySlugAction } from '@/modules/categories/actions'
import { getProductsAction } from '@/modules/products/actions'
import { CategoryDetailClient } from './CategoryDetailClient'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCachedCategory(slug: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('categories', `category-${slug}`)

  const categoryRes = await getCategoryBySlugAction(slug)
  if (!categoryRes.success || !categoryRes.data) {
    throw new Error(`Category ${slug} not found`)
  }
  return categoryRes.data
}

async function getCachedCategoryProducts(slug: string) {
  'use cache'
  cacheLife('weeks')
  cacheTag('products', 'categories')

  return getProductsAction({
    categorySlug: slug,
    limit: 40,
  })
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase.from('categories').select('slug').eq('is_active', true)
  return (data || []).map((c) => ({ slug: c.slug }))
}

export default async function CategoryDetailPage({
  params,
}: CategoryPageProps): Promise<React.JSX.Element> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  let category
  let products

  try {
    const [catRes, prodRes] = await Promise.all([
      getCachedCategory(slug),
      getCachedCategoryProducts(slug),
    ])
    category = catRes
    products = prodRes.data || []
  } catch {
    notFound()
  }

  return <CategoryDetailClient category={category} products={products} />
}
