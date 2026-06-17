'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Category } from '@/services/categories'

interface CategorySectionProps {
  categories: Category[]
}

export function CategorySection({ categories }: CategorySectionProps) {
  if (categories.length === 0) return null

  // Take first 4 or 6 main categories (without parents) for clean layout
  const mainCategories = categories.filter((c) => !c.parent_id).slice(0, 4)

  return (
    <section className="bg-white py-16 border-b border-neutral-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Kategori Pilihan
          </span>
          <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
            Kategori Belanja
          </h2>
          <div className="w-8 h-[1px] bg-brand-black pt-1" />
        </div>

        {/* Categories Grid (THENBLANK style clean rectangular boxes) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mainCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative aspect-square md:aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-neutral-100"
            >
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-w-7xl) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans uppercase">
                  {cat.name}
                </div>
              )}
              {/* Overlay Label (Centered or Bottom, simple sharp white card) */}
              <div className="absolute inset-0 bg-neutral-900/5 transition-opacity group-hover:opacity-20" />
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs py-3 text-center border border-neutral-200/50 shadow-xs transition-colors group-hover:bg-brand-black group-hover:text-white">
                <span className="text-[10px] font-heading font-semibold uppercase tracking-widest">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
