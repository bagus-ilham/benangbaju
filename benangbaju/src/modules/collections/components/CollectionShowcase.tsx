'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Collection } from '@/modules/collections/types'
import { ProductListItem } from '@/modules/products/types'
import { SmartLink as Link } from '@/shared/components'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { cn } from '@/lib/utils'

interface CollectionShowcaseProps {
  collection: Collection
  products: ProductListItem[]
  index?: number
}

export function CollectionShowcase({
  collection,
  products,
  index = 0,
}: CollectionShowcaseProps): React.JSX.Element {
  const isReversed = index % 2 === 1
  const sliderRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section className="relative w-full bg-[#f4f1ea] overflow-hidden">
      <div
        className={cn(
          'flex flex-col lg:flex-row min-h-[600px] lg:h-[800px]',
          isReversed && 'lg:flex-row-reverse'
        )}
      >
        {/* Image Section */}
        <div className="relative w-full lg:w-1/2 h-[400px] lg:h-full shrink-0">
          {collection.image_url ? (
            <Image
              src={collection.image_url}
              alt={collection.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority={index === 0}
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500 uppercase tracking-widest">{collection.name}</span>
            </div>
          )}
        </div>

        {/* Content & Products Section */}
        <div className="flex flex-col justify-between w-full lg:w-1/2 py-12 lg:py-20 px-6 lg:px-16 overflow-hidden">
          
          {/* Top Text */}
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-[#601b33] mb-6">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-[#601b33]/80 font-sans text-sm md:text-base leading-relaxed mb-8">
                {collection.description}
              </p>
            )}
            <Link
              href={`/koleksi/${collection.slug}`}
              className="inline-block text-[#601b33] font-medium border-b border-[#601b33] pb-1 transition-opacity hover:opacity-70"
            >
              Explore the {collection.name} Edit
            </Link>
          </div>

          {/* Bottom Products Slider */}
          <div className="relative w-full mt-auto">
            <div
              ref={sliderRef}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map((product) => (
                <div key={product.id} className="w-[200px] md:w-[260px] shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
              
              {/* Optional "View More" card at the end */}
              {products.length > 0 && (
                <div className="w-[200px] md:w-[260px] shrink-0 snap-start flex items-center justify-center bg-[#601b33]/5 group hover:bg-[#601b33]/10 transition-colors">
                  <Link
                    href={`/koleksi/${collection.slug}`}
                    className="flex flex-col items-center justify-center text-[#601b33] gap-2 h-full w-full py-20"
                  >
                    <div className="p-4 rounded-full bg-[#601b33] text-[#f4f1ea] group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Lihat Semua</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation Button */}
            {products.length > 2 && (
              <div 
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-10 hidden lg:block",
                  isReversed ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
                )}
              >
                <button
                  onClick={isReversed ? scrollLeft : scrollRight}
                  className="w-12 h-12 bg-[#601b33] text-[#f4f1ea] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4a1527] transition-colors"
                  aria-label={isReversed ? "Scroll Left" : "Scroll Right"}
                >
                  {isReversed ? <ArrowLeft className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
