import React from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { getCategoryBySlug } from '@/services/categories'
import { getProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import { PageHero, PageContainer, EmptyState } from '@/components/shared'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createServerClient()

  const category = await getCategoryBySlug(supabase, slug)

  if (!category) {
    notFound()
  }

  const { products } = await getProducts(supabase, {
    categorySlug: slug,
    limit: 40,
  })

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
          <div className="absolute inset-0 section-texture opacity-20 pointer-events-none" aria-hidden />
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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
