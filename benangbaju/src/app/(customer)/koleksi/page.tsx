import React from 'react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getActiveCollections } from '@/services/collections'
import Image from 'next/image'

export default async function CollectionsIndexPage() {
  const supabase = await createServerClient()
  const collections = await getActiveCollections(supabase)

  return (
    <div className="bg-neutral-50 min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Daftar Koleksi
          </span>
          <h1 className="text-3xl font-heading font-light uppercase tracking-widest text-brand-black">
            Koleksi Spesial
          </h1>
          <div className="h-[1px] w-12 bg-neutral-900 mx-auto" />
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            Jelajahi berbagai edisi dan koleksi produk kurasi premium dari Benangbaju.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link 
              key={col.id} 
              href={`/koleksi/${col.slug}`}
              className="group relative h-96 w-full overflow-hidden bg-neutral-200 border border-neutral-100 hover:shadow-lg transition-all duration-500"
            >
              {col.image_url ? (
                <Image
                  src={col.image_url}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400">No Image</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/40 transition-colors duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center space-y-2">
                <h2 className="text-xl font-heading font-light uppercase tracking-widest leading-none">
                  {col.name}
                </h2>
                <div className="h-[1px] w-6 bg-white/50 group-hover:w-12 transition-all duration-500" />
                {col.description && (
                  <p className="text-[10px] text-neutral-200 font-sans line-clamp-2 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {col.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
