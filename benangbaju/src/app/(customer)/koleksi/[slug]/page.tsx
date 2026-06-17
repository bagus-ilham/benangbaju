import React from 'react'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCollectionBySlug } from '@/services/collections'
import { getProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import Image from 'next/image'

interface CollectionPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Fetch collection info on the server
  const collection = await getCollectionBySlug(supabase, slug)

  if (!collection) {
    notFound()
  }

  // Fetch products under this collection
  const { products } = await getProducts(supabase, {
    collectionSlug: slug,
    limit: 40,
  })

  return (
    <div className="bg-white min-h-screen">
      {/* Collection banner */}
      {collection.image_url ? (
        <div className="relative h-[35vh] w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
          <Image
            src={collection.image_url}
            alt={collection.name}
            fill
            priority
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-neutral-950/20" />
          <div className="absolute inset-0 flex items-end p-8 md:p-12">
            <div className="mx-auto max-w-7xl w-full text-left space-y-2 text-white">
              <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-200">
                Koleksi Khusus
              </span>
              <h1 className="text-2xl md:text-5xl font-heading font-light uppercase tracking-widest leading-tight">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-xs text-neutral-200 font-sans max-w-lg leading-relaxed">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex flex-col space-y-2 border-b border-neutral-100 pb-6">
            <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
              Koleksi Khusus
            </span>
            <h1 className="text-xl md:text-3xl font-heading font-light uppercase tracking-wider text-brand-black">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-400 font-sans italic">
            Belum ada produk dalam koleksi ini.
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
