import React, { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { getProductsAction } from '@/modules/products/actions'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { CatalogClient } from './CatalogClient'
import { PageContainer, PageHero } from '@/shared/components'
import { ProductCardSkeleton } from '@/modules/products/components/ProductCardSkeleton'

interface CatalogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getCachedCatalogData(
  categorySlug?: string,
  sortBy?: 'newest' | 'featured' | 'price-low' | 'price-high' | 'popular',
  page?: number,
  limit?: number
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('products', 'catalog', 'categories')

  const [productsRes, categoriesRes] = await Promise.all([
    getProductsAction({
      categorySlug,
      sortBy,
      page,
      limit,
    }),
    getActiveCategoriesAction(),
  ])

  return {
    products: productsRes.data || [],
    totalCount: productsRes.pagination?.total_count || 0,
    categories: categoriesRes.data || [],
  }
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const categorySlug = typeof params.kategori === 'string' ? params.kategori : undefined
  const sortParam = typeof params.urutkan === 'string' ? params.urutkan : undefined
  const sortBy =
    sortParam === 'price-low' ||
    sortParam === 'price-high' ||
    sortParam === 'popular' ||
    sortParam === 'featured'
      ? sortParam
      : 'newest'
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const page = typeof params.halaman === 'string' ? Number(params.halaman) : 1
  const limit = 12

  let data
  let isError = false

  try {
    data = await getCachedCatalogData(categorySlug, sortBy, page, limit)
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
  )
}

export default function CatalogPage({ searchParams }: CatalogPageProps): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="bg-white min-h-screen">
          <PageHero
            eyebrow="Katalog Busana"
            title="Semua Produk"
            subtitle="Jelajahi koleksi fashion muslim premium dengan desain minimalis dan bahan berkualitas."
          />
          <PageContainer className="py-10 page-content">
            <div className="flex flex-col md:flex-row md:space-x-8">
              <aside className="hidden md:block w-48 flex-shrink-0 space-y-6">
                <div className="space-y-4">
                  <div className="h-4 w-20 bg-neutral-200/80 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-neutral-200/80 animate-pulse" />
                    <div className="h-3 w-3/4 bg-neutral-200/80 animate-pulse" />
                    <div className="h-3 w-5/6 bg-neutral-200/80 animate-pulse" />
                  </div>
                </div>
              </aside>
              <div className="flex-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 lg:gap-y-12">
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </PageContainer>
        </div>
      }
    >
      <CatalogContent searchParams={searchParams} />
    </Suspense>
  )
}
