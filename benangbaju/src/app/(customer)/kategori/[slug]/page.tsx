import React from 'react'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCategoryBySlug } from '@/services/categories'
import { getProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import Image from 'next/image'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Fetch category info on the server
  const category = await getCategoryBySlug(supabase, slug)

  if (!category) {
    notFound()
  }

  // Fetch products under this category
  const { products } = await getProducts(supabase, {
    categorySlug: slug,
    limit: 40,
  })

  return (
    <div className="bg-white min-h-screen">
      {/* Category banner (if image exists) */}
      {category.image_url ? (
        <div className="relative h-[30vh] w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            priority
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-neutral-950/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2 text-white">
              <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-200">
                Kategori Pilihan
              </span>
              <h1 className="text-2xl md:text-4xl font-heading font-light uppercase tracking-widest leading-tight">
                {category.name}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex flex-col space-y-2 border-b border-neutral-100 pb-6">
            <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
              Kategori Pilihan
            </span>
            <h1 className="text-xl md:text-3xl font-heading font-light uppercase tracking-wider text-brand-black">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-400 font-sans italic">
            Belum ada produk dalam kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
