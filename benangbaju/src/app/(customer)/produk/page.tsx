import React, { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getProducts } from '@/services/products'
import { getActiveCategories } from '@/services/categories'
import { CatalogClient } from './CatalogClient'
import { PageContainer, PageHero } from '@/components/shared'

interface CatalogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getCachedCatalogData(
  categorySlug?: string,
  searchQuery?: string,
  sortBy?: 'newest' | 'featured' | 'price-low' | 'price-high' | 'popular',
  page?: number,
  limit?: number
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('products', 'catalog', 'categories')

  const supabase = createStaticClient()
  
  const [productsRes, categories] = await Promise.all([
    getProducts(supabase, {
      categorySlug,
      searchQuery,
      sortBy,
      page,
      limit,
    }),
    getActiveCategories(supabase)
  ])

  return {
    products: productsRes.products,
    totalCount: productsRes.totalCount,
    categories
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) : Promise<React.JSX.Element> {
  const params = await searchParams

  const categorySlug = typeof params.kategori === 'string' ? params.kategori : undefined
  const sortParam = typeof params.urutkan === 'string' ? params.urutkan : undefined
  const sortBy = sortParam === 'price-low' || sortParam === 'price-high' || sortParam === 'popular' || sortParam === 'featured'
    ? sortParam
    : 'newest'
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const page = typeof params.halaman === 'string' ? Number(params.halaman) : 1
  const limit = 12

  let data
  let isError = false
  
  try {
    data = await getCachedCatalogData(categorySlug, searchQuery, sortBy, page, limit)
  } catch (error) {
    console.error('Error fetching catalog data:', error)
    isError = true
  }

  if (isError || !data) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero
          eyebrow="Katalog Busana"
          title="Semua Produk"
          subtitle="Jelajahi koleksi fashion muslim premium dengan desain minimalis dan bahan berkualitas."
        />
        <PageContainer className="py-10 page-content">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-3">
              Gagal Memuat Produk
            </h2>
            <p className="text-neutral-500 text-sm mb-8">
              Terjadi kesalahan saat memuat produk atau kategori dari server. Silakan coba kembali.
            </p>
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-xs text-neutral-400 uppercase tracking-widest font-heading">
        Memuat katalog...
      </div>
    }>
      <CatalogClient
        initialProducts={data.products}
        totalCount={data.totalCount}
        categories={data.categories}
        filters={{
          categorySlug,
          sortBy,
          searchQuery,
          page,
          limit,
        }}
      />
    </Suspense>
  )
}
