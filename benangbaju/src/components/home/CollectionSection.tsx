'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Collection } from '@/services/collections'

interface CollectionSectionProps {
  collections: Collection[]
}

export function CollectionSection({ collections }: CollectionSectionProps) {
  if (collections.length === 0) return null

  // Display top 2 collections in a large split layout
  const topCollections = collections.slice(0, 2)

  return (
    <section className="bg-white py-16 border-b border-neutral-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Editorial Curated
          </span>
          <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
            Koleksi Pilihan
          </h2>
          <div className="w-8 h-[1px] bg-brand-black pt-1" />
        </div>

        {/* Collections Split Layout (THENBLANK style large premium fashion banners side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topCollections.map((col) => (
            <Link
              key={col.id}
              href={`/koleksi/${col.slug}`}
              className="group relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 border border-neutral-100"
            >
              {col.image_url ? (
                <Image
                  src={col.image_url}
                  alt={col.name}
                  fill
                  sizes="(max-w-7xl) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans uppercase">
                  {col.name}
                </div>
              )}
              {/* Overlay (with text content overlay) */}
              <div className="absolute inset-0 bg-neutral-900/10 transition-opacity group-hover:opacity-20" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="space-y-2 max-w-xs md:max-w-sm">
                  <h3 className="text-lg md:text-xl font-heading font-semibold uppercase tracking-wider">
                    {col.name}
                  </h3>
                  {col.description && (
                    <p className="text-[10px] md:text-xs text-neutral-200 line-clamp-2 font-sans">
                      {col.description}
                    </p>
                  )}
                  <span className="inline-block pt-2 text-[10px] font-heading font-medium uppercase tracking-widest border-b border-white pb-0.5 hover:text-neutral-200 transition-colors">
                    Lihat Koleksi
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
