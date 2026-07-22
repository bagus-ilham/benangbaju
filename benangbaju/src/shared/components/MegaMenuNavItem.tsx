'use client'

import React, { useState, useEffect, useRef } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction } from '@/modules/collections/actions'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

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
  const [isHovered, setIsHovered] = useState(false)
  const [items, setItems] = useState<MegaMenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isKategori = label.toUpperCase() === 'KATEGORI'
  const isKoleksi = label.toUpperCase() === 'KOLEKSI'

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
    >
      <Link
        href={href}
        className={cn(
          'text-[10px] font-heading font-medium uppercase tracking-widest transition-colors duration-200 flex items-center gap-1 nav-link-underline h-16',
          isActive
            ? 'text-brand-accent font-semibold font-bold'
            : isTransparentHome
              ? 'text-white/90 hover:text-white'
              : 'text-neutral-500 hover:text-brand-accent'
        )}
      >
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-transform duration-200', isHovered ? 'rotate-180' : '')}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </Link>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full w-full bg-white shadow-xl border-t border-neutral-200 z-50 overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-12 gap-8 items-start">
                {/* Left Column: Link List */}
                <div className="col-span-3 flex flex-col space-y-4 pr-4 border-r border-neutral-100">
                  <h3 className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-black">
                    {isKategori ? 'Kategori Produk' : 'Koleksi Terbatas'}
                  </h3>

                  {isLoading ? (
                    <div className="space-y-3 py-2">
                      <div className="h-4 bg-neutral-100 animate-pulse w-3/4 rounded" />
                      <div className="h-4 bg-neutral-100 animate-pulse w-1/2 rounded" />
                      <div className="h-4 bg-neutral-100 animate-pulse w-2/3 rounded" />
                    </div>
                  ) : (
                    <ul className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-200">
                      {items.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                            className="text-xs font-sans text-neutral-600 hover:text-brand-accent transition-colors block py-0.5"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-2">
                    <Link
                      href={href}
                      className="text-[11px] font-heading font-semibold uppercase tracking-widest text-brand-accent hover:opacity-70 transition-opacity flex items-center gap-1.5"
                    >
                      JELAJAHI SEMUA &rarr;
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
                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-white hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScroll('right')}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-white hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="h-4 w-4" />
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
                            className="flex-none w-[240px] aspect-[4/3] rounded-xl bg-neutral-100 animate-pulse"
                          />
                        ))
                      : items.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                            className="flex-none w-[240px] aspect-[4/3] snap-start rounded-xl overflow-hidden relative group/card bg-neutral-100 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
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
                              <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center" />
                            )}
                            <div className="absolute inset-0 bg-black/25 group-hover/card:bg-black/40 transition-colors duration-300" />
                            <h4 className="absolute z-10 text-white font-heading text-sm md:text-base uppercase tracking-wider text-center px-3 font-semibold drop-shadow-md">
                              {item.name}
                            </h4>
                          </Link>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
