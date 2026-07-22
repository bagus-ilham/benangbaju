'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Collection } from '@/modules/collections/types'
import { ProductListItem } from '@/modules/products/types'
import { SmartLink as Link } from '@/shared/components'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { EASE_PREMIUM } from '@/lib/motion'

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
  const bgColor = isReversed ? 'bg-brand-black' : 'bg-brand-cream section-texture'
  const textColor = isReversed ? 'text-white' : 'text-brand-black'
  const textMuted = isReversed ? 'text-white/80' : 'text-brand-black/80'
  const borderColor = isReversed ? 'border-brand-accent-light' : 'border-brand-accent'
  const btnBg = isReversed ? 'bg-brand-accent' : 'bg-brand-black'
  const btnText = 'text-white'
  const btnHover = isReversed ? 'hover:bg-brand-accent-light' : 'hover:bg-brand-dark'
  const cardContainerClass = isReversed ? 'bg-white p-2 border border-neutral-100 rounded-2xl shadow-sm' : ''

  const sliderRef = useRef<HTMLDivElement>(null)

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section
      className={cn('relative w-full overflow-hidden transition-colors duration-500', bgColor)}
    >
      <div
        className={cn(
          'flex flex-col lg:flex-row min-h-[600px] lg:h-[800px]',
          isReversed && 'lg:flex-row-reverse'
        )}
      >
        {/* Image Section with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE_PREMIUM }}
          className="relative w-full lg:w-1/2 h-[400px] lg:h-full shrink-0 overflow-hidden"
        >
          {collection.image_url ? (
            <Image
              src={getProxiedImageUrl(collection.image_url)}
              alt={collection.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority={index === 0}
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500 uppercase tracking-widest">{collection.name}</span>
            </div>
          )}
        </motion.div>

        {/* Content & Products Section */}
        <div className="flex flex-col justify-between w-full lg:w-1/2 py-12 lg:py-20 px-6 lg:px-16 overflow-hidden">
          {/* Top Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE_PREMIUM }}
            className="max-w-xl mb-12"
          >
            <h2
              className={cn(
                'text-3xl md:text-4xl lg:text-5xl font-heading font-medium mb-6 transition-colors duration-500',
                textColor
              )}
            >
              {collection.name}
            </h2>
            <div className="stitch-divider mb-6 max-w-[200px]" />
            {collection.description && (
              <p
                className={cn(
                  'font-sans text-sm md:text-base leading-relaxed mb-8 transition-colors duration-500',
                  textMuted
                )}
              >
                {collection.description}
              </p>
            )}
            <Link
              href={`/koleksi/${collection.slug}`}
              className={cn(
                'inline-block font-heading font-bold uppercase tracking-wider text-[10px] border-b pb-1 transition-all',
                textColor,
                borderColor,
                isReversed ? 'hover:text-brand-accent-light hover:border-brand-accent-light' : 'hover:text-brand-accent hover:border-brand-accent'
              )}
            >
              Explore the {collection.name} Edit
            </Link>
          </motion.div>

          {/* Bottom Products Slider */}
          <div className="relative w-full mt-auto">
            <div
              ref={sliderRef}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className={cn('w-[200px] md:w-[260px] shrink-0 snap-start', cardContainerClass)}
                >
                  <ProductCard product={product} />
                </div>
              ))}

              {/* Optional "View More" card at the end */}
              {products.length > 0 && (
                <div className="w-[200px] md:w-[260px] shrink-0 snap-start flex items-center justify-center group transition-colors">
                  <Link
                    href={`/koleksi/${collection.slug}`}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 h-full w-full py-20',
                      textColor
                    )}
                  >
                    <div
                      className={cn(
                        'p-4 rounded-full group-hover:scale-110 transition-transform shadow-sm',
                        btnBg,
                        btnText
                      )}
                    >
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
                  'absolute top-1/2 -translate-y-1/2 z-10 hidden lg:block right-0 translate-x-1/2'
                )}
              >
                <button
                  onClick={scrollRight}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors',
                    btnBg,
                    btnText,
                    btnHover
                  )}
                  aria-label="Scroll Right"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
