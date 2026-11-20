'use client'

import React, { useState, useEffect, useRef } from 'react'
import { SmartLink as Link, HandDrawnIcon, ScallopEdge } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction } from '@/modules/collections/actions'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { useMarket } from '@/shared/stores/marketStore'

interface MegaMenuItem {
  name: string
  slug: string
  image_url?: string | null
}

interface MegaMenuNavItemProps {
  label: string
  href: string
  isActive: boolean
  isTransparentHome: boolean
}

export function MegaMenuNavItem({
  label,
  href,
  isActive,
  isTransparentHome,
}: MegaMenuNavItemProps) {
  const market = useMarket()
  const isMY = market === 'MY'
  const [isHovered, setIsHovered] = useState(false)
  const [items, setItems] = useState<MegaMenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isKategori =
    href === '/kategori' ||
    label.toUpperCase() === 'KATEGORI' ||
    label.toUpperCase() === 'CATEGORIES'
  const isKoleksi =
    href === '/koleksi' ||
    label.toUpperCase() === 'KOLEKSI' ||
    label.toUpperCase() === 'COLLECTIONS'

  useEffect(() => {
    if ((isKategori || isKoleksi) && items.length === 0) {
      let isMounted = true
      const fetchData = async () => {
        setIsLoading(true)
        try {
          if (isKategori) {
            const res = await getActiveCategoriesAction()
            if (res.data && isMounted) setItems(res.data)
          } else if (isKoleksi) {
            const res = await getActiveCollectionsAction(1, 50)
            if (res.data && isMounted) setItems(res.data)
          }
        } catch (error) {
          console.error(`Failed to fetch ${label} mega menu items:`, error)
        } finally {
          if (isMounted) setIsLoading(false)
        }
      }
      fetchData()
      return () => {
        isMounted = false
      }
    }
  }, [isKategori, isKoleksi, label, items.length])

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsHovered(false)
        }
      }}
    >
      <Link
        href={href}
        className={cn(
          'text-[11px] font-heading font-semibold uppercase tracking-[0.14em] transition-colors duration-200 flex items-center gap-1 nav-link-underline h-14 md:h-[60px] whitespace-nowrap',
          isActive
            ? 'text-brand-plum font-bold'
            : isTransparentHome
              ? 'text-white/90 hover:text-white'
              : 'text-neutral-600 hover:text-brand-plum'
        )}
      >
        {label}
        <HandDrawnIcon
          name="chevron-down"
          className={cn('h-3 w-3 transition-transform duration-200', isHovered ? 'rotate-180' : '')}
        />
      </Link>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full w-full bg-brand-cream shadow-[0_18px_40px_-15px_rgba(45,38,64,0.16)] border-t border-brand-plum/10 z-50"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-12 gap-8 items-start">
                {/* Left Column: Link List */}
                <div className="col-span-3 flex flex-col space-y-4 pr-5 border-r border-brand-plum/10">
                  <div className="space-y-0.5">
                    <span className="inline-block text-sm font-accent font-bold text-brand-blue-text leading-none">
                      {isMY ? 'Explore' : 'Jelajahi'}
                    </span>
                    <h3 className="text-lg font-serif font-medium tracking-tight text-brand-plum">
                      {isMY
                        ? isKategori
                          ? 'Product Categories'
                          : 'Curated Collections'
                        : isKategori
                          ? 'Kategori Produk'
                          : 'Koleksi Terbatas'}
                    </h3>
                  </div>

                  {isLoading ? (
                    <div className="space-y-3 py-2">
                      <div className="h-4 bg-brand-rose-soft/60 animate-pulse w-3/4 rounded-lg" />
                      <div className="h-4 bg-brand-rose-soft/60 animate-pulse w-1/2 rounded-lg" />
                      <div className="h-4 bg-brand-rose-soft/60 animate-pulse w-2/3 rounded-lg" />
                    </div>
                  ) : (
                    <ul className="space-y-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200">
                      {items.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                            onClick={() => setIsHovered(false)}
                            className="text-xs font-sans text-neutral-600 hover:bg-brand-blue-soft/65 hover:text-brand-plum font-medium hover:font-semibold transition-all block px-2.5 py-1.5 -mx-2.5 rounded-xl"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-1">
                    <Link
                      href={href}
                      onClick={() => setIsHovered(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-gold-soft/80 hover:bg-brand-gold text-brand-plum border border-brand-gold-stroke/45 text-[10px] font-sans font-bold uppercase tracking-widest transition-all shadow-2xs"
                    >
                      {isMY ? 'View All →' : 'Jelajahi Semua →'}
                    </Link>
                  </div>
                </div>

                {/* Right Column: Scrollable Cards Carousel */}
                <div className="col-span-9 relative group/carousel">
                  {items.length > 3 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleScroll('left')}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-brand-cream/95 shadow-md border border-brand-plum/15 flex items-center justify-center text-brand-plum hover:bg-brand-gold hover:border-brand-gold-stroke hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
                        aria-label="Scroll left"
                      >
                        <HandDrawnIcon name="chevron-left" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScroll('right')}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-brand-cream/95 shadow-md border border-brand-plum/15 flex items-center justify-center text-brand-plum hover:bg-brand-gold hover:border-brand-gold-stroke hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
                        aria-label="Scroll right"
                      >
                        <HandDrawnIcon name="chevron-right" className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <div
                    ref={scrollRef}
                    className="flex space-x-4 overflow-x-auto scrollbar-none py-1 scroll-smooth snap-x"
                  >
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-none w-[240px] aspect-[4/3] rounded-2xl bg-brand-rose-soft/60 animate-pulse"
                          />
                        ))
                      : items.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                            onClick={() => setIsHovered(false)}
                            className="flex-none w-[240px] aspect-[4/3] snap-start rounded-2xl overflow-hidden relative group/card bg-brand-rose-soft/65 border border-brand-plum/10 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                          >
                            {item.image_url ? (
                              <Image
                                src={getProxiedImageUrl(item.image_url)}
                                alt={item.name}
                                fill
                                sizes="240px"
                                className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-brand-rose-soft/75 flex items-center justify-center" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-plum/85 via-brand-plum/20 to-transparent transition-opacity duration-300 group-hover/card:from-brand-plum/90" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 text-left">
                              <h4 className="text-brand-cream font-serif text-base md:text-lg font-medium tracking-tight leading-snug drop-shadow-sm">
                                {item.name}
                              </h4>
                              <div className="w-0 group-hover/card:w-12 h-0.5 bg-brand-gold rounded-full transition-all duration-300 mt-1.5" />
                            </div>
                          </Link>
                        ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle scalloped bottom hem on open mega menu tray */}
            <ScallopEdge
              direction="down"
              fill="var(--color-brand-cream)"
              stroke="rgba(45,38,64,0.12)"
              strokeOpacity={0.65}
              tileWidth={56}
              height={18}
              className="absolute left-0 right-0 top-full -mt-px pointer-events-none drop-shadow-[0_6px_8px_rgba(45,38,64,0.08)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
