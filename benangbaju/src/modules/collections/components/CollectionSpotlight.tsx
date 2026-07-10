'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Collection } from '@/modules/collections/types'
import { PageContainer } from '@/shared/components'
import { EASE_PREMIUM } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface CollectionSpotlightProps {
  collection: Collection
  variant?: 'light' | 'dark'
  index?: number
}

export function CollectionSpotlight({
  collection,
  variant = 'light',
  index = 0,
}: CollectionSpotlightProps): React.JSX.Element {
  const isReversed = index % 2 === 1
  const isDark = variant === 'dark'

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-neutral-100',
        isDark ? 'bg-brand-black' : 'bg-brand-cream section-texture'
      )}
    >
      <PageContainer className="py-12 md:py-16">
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center',
            isReversed && 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1'
          )}
        >
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_PREMIUM }}
            className="relative"
          >
            <Link
              href={`/koleksi/${collection.slug}`}
              className="group relative block aspect-[4/5] md:aspect-[3/4] w-full overflow-hidden"
            >
              {collection.image_url ? (
                <Image
                  src={collection.image_url}
                  alt={collection.name}
                  fill
                  sizes="(max-w-7xl) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-neutral-200 text-xs text-neutral-400 font-sans uppercase">
                  {collection.name}
                </div>
              )}
              <div className="absolute inset-0 gradient-overlay-dark opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

              {/* Floating badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-white/50">
                <span className="text-[9px] font-heading font-semibold uppercase tracking-[0.2em] text-brand-black">
                  Koleksi Eksklusif
                </span>
              </div>
            </Link>

            {/* Decorative frame offset */}
            <div
              className={cn(
                'absolute -bottom-3 -right-3 w-full h-full border pointer-events-none hidden md:block',
                isDark ? 'border-brand-gold/30' : 'border-brand-gold/40'
              )}
              aria-hidden
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_PREMIUM }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <span
                className={cn(
                  'inline-block text-[10px] uppercase tracking-[0.25em] font-heading font-medium',
                  isDark ? 'text-brand-gold-light' : 'text-brand-gold'
                )}
              >
                Koleksi Kurasi
              </span>
              <h2
                className={cn(
                  'text-2xl md:text-4xl font-heading font-light uppercase tracking-wider leading-tight',
                  isDark ? 'text-white' : 'text-brand-black'
                )}
              >
                {collection.name}
              </h2>
              <div className="accent-line" />
            </div>

            {collection.description && (
              <p
                className={cn(
                  'text-xs md:text-sm font-sans leading-relaxed max-w-md',
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                )}
              >
                {collection.description}
              </p>
            )}

            <Link
              href={`/koleksi/${collection.slug}`}
              className={cn(
                'inline-flex items-center gap-2 text-[10px] font-heading font-semibold uppercase tracking-[0.2em] transition-all duration-300 group/link',
                isDark
                  ? 'text-white hover:text-brand-gold-light'
                  : 'text-brand-black hover:text-brand-gold'
              )}
            >
              <span className="border-b border-current pb-0.5">Jelajahi Koleksi</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </PageContainer>
    </section>
  )
}
