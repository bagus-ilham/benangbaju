'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Collection } from '@/modules/collections/types'
import { ProductListItem } from '@/modules/products/types'
import { SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { EASE_PREMIUM } from '@/lib/motion'

interface CollectionShowcaseProps {
  collection: Collection
  products: ProductListItem[]
  index?: number
  decorativeSvg?: string
}

export function CollectionShowcase({
  collection,
  products,
  index = 0,
  decorativeSvg,
}: CollectionShowcaseProps): React.JSX.Element {
  const isReversed = index % 2 === 1
  const bgColor = isReversed ? 'bg-brand-gold/60' : 'bg-brand-blue/50'
  const textColor = 'text-brand-plum'
  const textMuted = 'text-brand-plum/80'
  const borderColor = isReversed ? 'border-brand-blue' : 'border-brand-gold'
  const btnBg = isReversed ? 'bg-brand-plum' : 'bg-brand-gold'
  const btnText = isReversed ? 'text-brand-blue font-bold' : 'text-brand-plum font-bold'
  const btnHover = isReversed ? 'hover:bg-brand-plum/90' : 'hover:bg-amber-200'
  const cardContainerClass =
    'bg-brand-cream p-2 border border-neutral-200/80 rounded-2xl shadow-sm'

  const col1LogoMark = decorativeSvg || '/image/svg/decorative/logo-mark.svg'
  const col2Pattern = decorativeSvg || '/image/svg/decorative/pattern-stitch-card.svg'

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
      {/* Background Decorative Accents */}
      {index % 2 === 0 ? (
        <>
          {/* Collection 1: Upright Logo Mark */}
          <div
            className="absolute -top-16 -right-6 md:-top-24 md:right-4 w-44 md:w-60 lg:w-72 h-[400px] md:h-[520px] lg:h-[640px] opacity-15 md:opacity-20 pointer-events-none select-none z-0"
            aria-hidden="true"
          >
            <Image
              src={col1LogoMark}
              alt=""
              fill
              unoptimized
              className="object-contain object-top"
            />
          </div>

          {/* Collection 1: Inverted / Flipped Logo Mark */}
          <div
            className="absolute -bottom-16 right-40 md:right-72 lg:right-96 w-44 md:w-60 lg:w-72 h-[400px] md:h-[520px] lg:h-[640px] opacity-15 md:opacity-20 pointer-events-none select-none z-0 rotate-180"
            aria-hidden="true"
          >
            <Image
              src={col1LogoMark}
              alt=""
              fill
              unoptimized
              className="object-contain object-bottom"
            />
          </div>
        </>
      ) : (
        /* Collection 2: Tiled Pattern Stitch Card Background */
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 opacity-10 bg-repeat"
          style={{
            backgroundImage: `url('${col2Pattern}')`,
            backgroundSize: '360px 42px',
          }}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'relative z-10 flex flex-col lg:flex-row min-h-[600px] lg:h-[800px]',
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
                'text-3xl md:text-4xl lg:text-5xl font-sans font-bold mb-6 transition-colors duration-500',
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
                isReversed
                  ? 'hover:text-brand-accent-light hover:border-brand-accent-light'
                  : 'hover:text-brand-accent hover:border-brand-accent'
              )}
            >
              Explore the {collection.name}
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
                      <HandDrawnIcon name="arrow-right" className="w-5 h-5" />
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
                  <HandDrawnIcon name="arrow-right" className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
