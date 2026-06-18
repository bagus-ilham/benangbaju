import React from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PackageSearch } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getCollectionBySlug } from '@/services/collections'
import { getProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import { PageHero, PageContainer, EmptyState } from '@/components/shared'

interface CollectionPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params
  const supabase = await createServerClient()

  const collection = await getCollectionBySlug(supabase, slug)

  if (!collection) {
    notFound()
  }

  const { products } = await getProducts(supabase, {
    collectionSlug: slug,
    limit: 40,
  })

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
          <div className="absolute inset-0 section-texture opacity-20 pointer-events-none" aria-hidden />
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
            icon={PackageSearch}
            title="Belum Ada Produk"
            description="Belum ada produk dalam koleksi ini. Coba jelajahi koleksi lain."
            action={{ label: 'Lihat Semua Koleksi', href: '/koleksi' }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
