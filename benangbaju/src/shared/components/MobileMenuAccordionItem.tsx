'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction } from '@/modules/collections/actions'
import { useMarket } from '@/shared/stores/marketStore'

interface MobileMenuItem {
  name: string
  slug: string
}

interface MobileMenuAccordionItemProps {
  label: string
  href: string
  pathname: string
  onClose: () => void
}

export function MobileMenuAccordionItem({
  label,
  href,
  pathname,
  onClose,
}: MobileMenuAccordionItemProps) {
  const market = useMarket()
  const isMY = market === 'MY'
  const [isExpanded, setIsExpanded] = useState(false)
  const [items, setItems] = useState<MobileMenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const isKategori =
    href === '/kategori' ||
    label.toUpperCase() === 'KATEGORI' ||
    label.toUpperCase() === 'CATEGORIES'
  const isKoleksi =
    href === '/koleksi' ||
    label.toUpperCase() === 'KOLEKSI' ||
    label.toUpperCase() === 'COLLECTIONS'
  const isAccordion = isKategori || isKoleksi
  const isActive = pathname === href || pathname.startsWith(href + '/')

  useEffect(() => {
    if (isAccordion && !hasFetched) {
      let isMounted = true
      const fetchData = async () => {
        setIsLoading(items.length === 0)
        try {
          if (isKategori) {
            const res = await getActiveCategoriesAction()
            if (res.data && isMounted) setItems(res.data)
          } else if (isKoleksi) {
            const res = await getActiveCollectionsAction(1, 50)
            if (res.data && isMounted) setItems(res.data)
          }
        } catch (error) {
          console.error(`Failed to fetch ${label} mobile menu items:`, error)
        } finally {
          if (isMounted) {
            setIsLoading(false)
            setHasFetched(true)
          }
        }
      }
      fetchData()
      return () => {
        isMounted = false
      }
    }
  }, [isAccordion, hasFetched, isKategori, isKoleksi, label, items.length])

  if (!isAccordion) {
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-plum transition-colors duration-200',
          isActive && 'text-brand-plum font-bold'
        )}
      >
        <span>{label}</span>
        <HandDrawnIcon name="chevron-right" className="h-3 w-3 text-neutral-400 opacity-60" />
      </Link>
    )
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-plum transition-colors duration-200 w-full text-left',
          isActive && 'text-brand-plum font-bold'
        )}
      >
        <span>{label}</span>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <HandDrawnIcon name="chevron-down" className="h-3 w-3 text-neutral-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-3 pr-2 py-2 flex flex-col space-y-1 border-l-2 border-brand-blue-stroke ml-1 mt-1 mb-2">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-3 bg-brand-rose-soft/60 animate-pulse w-3/4 rounded" />
                  <div className="h-3 bg-brand-rose-soft/60 animate-pulse w-1/2 rounded" />
                  <div className="h-3 bg-brand-rose-soft/60 animate-pulse w-2/3 rounded" />
                </div>
              ) : (
                <>
                  {items.map((item) => {
                    const isSubActive = pathname === `/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`
                    return (
                      <Link
                        key={item.slug}
                        href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                        onClick={onClose}
                        className={cn(
                          'text-xs font-sans transition-all duration-200 block px-2.5 py-1.5 rounded-xl',
                          isSubActive
                            ? 'bg-brand-blue-soft/80 text-brand-plum font-bold'
                            : 'text-neutral-600 hover:bg-brand-blue-soft/50 hover:text-brand-plum'
                        )}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                  <Link
                    href={href}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 w-max mt-2 px-3 py-1.5 rounded-full bg-brand-gold-soft/80 hover:bg-brand-gold text-[10px] font-sans font-bold uppercase tracking-widest text-brand-plum border border-brand-gold-stroke/45 transition-all"
                  >
                    {isMY ? `View All ${label} →` : `Lihat Semua ${label} →`}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
