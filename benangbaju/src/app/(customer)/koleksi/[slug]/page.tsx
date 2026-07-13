import React from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getCollectionBySlugAction } from '@/modules/collections/actions'
import { getProductsAction } from '@/modules/products/actions'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PageHero, PageContainer, EmptyState } from '@/shared/components'

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
    throw new Error(`Collection ${slug} not found`)
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
    collection = colRes
    products = prodRes.data || []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    notFound()
  }

  return (
    <div className="bg-white min-h-screen">
      {collection.image_url ? (
        <div className="relative h-[35vh] md:h-[50vh] w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
          <Image
            src={collection.image_url}
            alt={collection.name}
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
                Koleksi Khusus
              </span>
              <h1 className="text-2xl md:text-5xl font-heading font-light uppercase tracking-wider text-white mt-2 leading-tight">
                {collection.name}
              </h1>
              <div className="w-12 h-px bg-brand-gold-light mt-3" />
              {collection.description && (
                <p className="text-xs text-neutral-300 font-sans max-w-lg leading-relaxed mt-3">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <PageHero
          eyebrow="Koleksi Khusus"
          title={collection.name}
          subtitle={collection.description || undefined}
        />
      )}

      <PageContainer className="py-12 md:py-16 page-content">
        {products.length === 0 ? (
          <EmptyState
            icon="PackageSearch"
            title="Belum Ada Produk"
            description="Belum ada produk dalam koleksi ini. Coba jelajahi koleksi lain."
            action={{ label: 'Lihat Semua Koleksi', href: '/koleksi' }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            }
          </div>
        )}
      </PageContainer>
    </div>
  )
}
