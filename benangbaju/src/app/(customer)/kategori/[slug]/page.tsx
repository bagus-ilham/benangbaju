/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getCategoryBySlugAction } from '@/modules/categories/actions'
import { getProductsAction } from '@/modules/products/actions'
import { Category } from '@/modules/categories/types'
import { PageContainer, PageHero, EmptyState } from '@/shared/components'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PackageX } from 'lucide-react'

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
  } catch (err) {
    notFound()
  }

  return (
    <div className="bg-white min-h-screen">
      {category.image_url ? (
        <div className="relative h-[35vh] md:h-[45vh] w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 gradient-overlay-dark" />
          <div
            className="absolute inset-0 section-texture opacity-20 pointer-events-none"
            aria-hidden
          />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-heading font-medium text-brand-gold-light">
                Kategori Pilihan
              </span>
              <h1 className="text-2xl md:text-4xl font-heading font-light uppercase tracking-wider text-white mt-2 leading-tight">
                {category.name}
              </h1>
              <div className="w-12 h-px bg-brand-gold-light mt-3" />
              {category.description && (
                <p className="text-xs text-neutral-300 font-sans max-w-lg leading-relaxed mt-3">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <PageHero
          eyebrow="Kategori Pilihan"
          title={category.name}
          subtitle={category.description || undefined}
        />
      )}

      <PageContainer className="py-12 md:py-16 page-content">
        {products.length === 0 ? (
          <EmptyState
            icon="PackageSearch"
            title="Belum Ada Produk"
            description="Belum ada produk dalam kategori ini. Coba jelajahi kategori lain."
            action={{ label: 'Lihat Semua Produk', href: '/produk' }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
