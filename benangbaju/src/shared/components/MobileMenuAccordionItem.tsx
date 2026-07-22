'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction } from '@/modules/collections/actions'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [items, setItems] = useState<MobileMenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const isKategori = label.toUpperCase() === 'KATEGORI'
  const isKoleksi = label.toUpperCase() === 'KOLEKSI'
  const isAccordion = isKategori || isKoleksi
  const isActive = pathname === href || pathname.startsWith(href + '/')

  useEffect(() => {
    if (isAccordion && isExpanded && !hasFetched) {
      let isMounted = true
      const fetchData = async () => {
        setIsLoading(true)
        try {
          if (isKategori) {
            const res = await getActiveCategoriesAction()
            if (res.data && isMounted) setItems(res.data)
          } else if (isKoleksi) {
            const res = await getActiveCollectionsAction(1, 20)
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
  }, [isAccordion, isExpanded, hasFetched, isKategori, isKoleksi, label])

  if (!isAccordion) {
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-black',
          isActive && 'text-brand-black font-semibold'
        )}
      >
        <span>{label}</span>
        <ChevronRight className="h-3 w-3 text-neutral-400" />
      </Link>
    )
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-black w-full text-left',
          isActive && 'text-brand-black font-semibold'
        )}
      >
        <span>{label}</span>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3 w-3 text-neutral-400" />
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
            <div className="pl-4 pr-2 py-2 flex flex-col space-y-3 border-l-2 border-neutral-100 ml-1 mt-1 mb-2">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-3 bg-neutral-100 animate-pulse w-3/4 rounded" />
                  <div className="h-3 bg-neutral-100 animate-pulse w-1/2 rounded" />
                  <div className="h-3 bg-neutral-100 animate-pulse w-2/3 rounded" />
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}`}
                      onClick={onClose}
                      className={cn(
                        'text-xs font-sans text-neutral-500 hover:text-brand-black block py-1',
                        pathname === `/${isKategori ? 'kategori' : 'koleksi'}/${item.slug}` &&
                          'text-brand-black font-semibold'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href={href}
                    onClick={onClose}
                    className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-accent hover:text-brand-black pt-2 block"
                  >
                    Lihat Semua {label} &rarr;
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
