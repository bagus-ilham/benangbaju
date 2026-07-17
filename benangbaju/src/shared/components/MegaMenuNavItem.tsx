'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction } from '@/modules/collections/actions'

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

  const isKategori = label.toUpperCase() === 'KATEGORI'
  const isKoleksi = label.toUpperCase() === 'KOLEKSI'

  useEffect(() => {
    // Only fetch if it's one of the mega menus and we haven't fetched yet
    if ((isKategori || isKoleksi) && items.length === 0) {
      let isMounted = true
      const fetchData = async () => {
        setIsLoading(true)
        try {
          if (isKategori) {
            const res = await getActiveCategoriesAction()
            if (res.data && isMounted) setItems(res.data)
          } else if (isKoleksi) {
            const res = await getActiveCollectionsAction(1, 10)
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

  // Get max 3 items for images
  const topItems = items.slice(0, 3)

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
            ? 'text-brand-gold font-semibold font-bold'
            : isTransparentHome
              ? 'text-white/90 hover:text-white'
              : 'text-neutral-500 hover:text-brand-gold'
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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-12 gap-8">
                
                {/* Left Column: Link List */}
                <div className="col-span-3 flex flex-col space-y-6">
                  <h3 className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-black mb-2">
                    {isKategori ? 'Kategori Produk' : 'Koleksi Terbatas'}
                  </h3>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-neutral-100 animate-pulse w-3/4 rounded" />
                      <div className="h-4 bg-neutral-100 animate-pulse w-1/2 rounded" />
                      <div className="h-4 bg-neutral-100 animate-pulse w-2/3 rounded" />
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {items.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                            className="text-sm font-sans text-neutral-600 hover:text-brand-gold transition-colors block"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="pt-6 mt-auto">
                    <Link
                      href={href}
                      className="text-xs font-heading font-semibold uppercase tracking-widest text-[#601b33] hover:opacity-70 transition-opacity flex items-center gap-2"
                    >
                      JELAJAHI SEMUA &rarr;
                    </Link>
                  </div>
                </div>

                {/* Right Column: 3 Top Items Images */}
                <div className="col-span-9 grid grid-cols-3 gap-6">
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-neutral-100 animate-pulse aspect-square" />
                      ))
                    : topItems.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                          className="group relative aspect-[4/3] overflow-hidden bg-neutral-200 flex items-center justify-center cursor-pointer"
                        >
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              sizes="(max-width: 1200px) 25vw, 300px"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                              {/* Gray placeholder if no image */}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                          <h4 className="absolute z-10 text-white font-heading text-lg md:text-xl lg:text-2xl uppercase tracking-wider text-center px-4 font-medium drop-shadow-md">
                            {item.name}
                          </h4>
                        </Link>
                      ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
