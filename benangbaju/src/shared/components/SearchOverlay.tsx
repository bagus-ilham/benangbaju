/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import { safeLogError } from '@/lib/logger'
import { getProductsAction } from '@/modules/products/actions'
import { type ProductListItem } from '@/modules/products/types'
import { createBrowserClient } from '@/lib/supabase/client'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const [supabase] = useState(() => createBrowserClient())

  const [searchQuery, setSearchQuery] = useState('')
  const [instantResults, setInstantResults] = useState<ProductListItem[]>([])
  const [isSearchingInstant, setIsSearchingInstant] = useState(false)

  const overlayRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(isOpen, overlayRef, { onClose })

  useEffect(() => {
    if (!isOpen || searchQuery.trim().length < 2) {
      const t = setTimeout(() => {
        setInstantResults([])
        setIsSearchingInstant(false)
      }, 0)
      return () => clearTimeout(t)
    }

    const startTimer = setTimeout(() => setIsSearchingInstant(true), 0)
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await getProductsAction({ searchQuery: searchQuery.trim(), limit: 3 })
        setInstantResults(res.data || [])
      } catch (err) {
        safeLogError('Instant search error:', err)
      } finally {
        setIsSearchingInstant(false)
      }
    }, 300)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(delayDebounceFn)
    }
  }, [searchQuery, isOpen, supabase])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-md flex flex-col items-center justify-start pt-20 px-4"
        >
          <div className="absolute inset-0 -z-10" onClick={onClose} />

          <motion.div
            ref={overlayRef}
            initial={{ y: -50, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -30, scale: 0.95 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            className="w-full max-w-2xl bg-white p-6 md:p-8 shadow-2xl relative border border-t-2 border-t-brand-gold border-neutral-100"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-brand-black transition-colors"
              aria-label="Tutup pencarian"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                  Cari Koleksi
                </span>
                <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black">
                  Pencarian Produk
                </h3>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  label="Kata kunci"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan kata kunci produk (cth: linen, kemeja, hijab)..."
                  rightIcon={
                    <button type="submit" aria-label="Cari produk">
                      <Search className="h-4 w-4" />
                    </button>
                  }
                  autoFocus
                />
              </form>

              {searchQuery.trim().length >= 2 && (
                <div className="border border-neutral-100 bg-neutral-50/50 p-4 -mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                      Hasil Pencarian Instan
                    </span>
                    {isSearchingInstant && (
                      <div className="flex items-center space-x-1.5 text-brand-gold">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[8px] font-heading font-semibold uppercase tracking-wider">
                          Mencari...
                        </span>
                      </div>
                    )}
                  </div>

                  {instantResults.length > 0 ? (
                    <div className="space-y-3">
                      {instantResults.map((product) => {
                        const primaryImg =
                          product.product_images?.find((img) => img.is_primary)?.url ||
                          product.product_images?.[0]?.url ||
                          null

                        const prices = product.product_variants?.map((v) => Number(v.price)) || []
                        const minPrice = prices.length > 0 ? Math.min(...prices) : 0

                        return (
                          <Link
                            key={product.id}
                            href={`/produk/${product.slug}`}
                            onClick={onClose}
                            className="flex items-center space-x-3 p-2 bg-white border border-neutral-100 hover:border-brand-gold/50 transition-all duration-200 group"
                          >
                            <div className="relative aspect-[3/4] w-10 bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0">
                              {primaryImg ? (
                                <Image
                                  src={primaryImg}
                                  alt={product.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[7px] text-neutral-400 uppercase font-sans">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-brand-black truncate group-hover:text-brand-gold transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-[10px] font-sans font-medium text-neutral-500 mt-0.5">
                                {formatIDR(minPrice)}
                              </p>
                            </div>
                            <div className="pr-2 text-neutral-300 group-hover:text-brand-gold transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Link>
                        )
                      })}

                      <button
                        onClick={handleSearchSubmit}
                        className="w-full pt-2 pb-1 text-[10px] uppercase tracking-widest font-heading font-semibold text-brand-gold hover:text-brand-black transition-colors"
                      >
                        Lihat semua hasil untuk "{searchQuery}"
                      </button>
                    </div>
                  ) : !isSearchingInstant ? (
                    <div className="py-4 text-center">
                      <p className="text-[10px] text-neutral-500 font-sans">
                        Tidak ada produk yang cocok dengan "{searchQuery}"
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
