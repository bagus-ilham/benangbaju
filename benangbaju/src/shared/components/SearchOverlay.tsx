'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, ChevronRight, History, Sparkles } from 'lucide-react'
import { Input } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import { safeLogError } from '@/lib/logger'
import { getProductsAction, logSearchAction } from '@/modules/products/actions'
import { type ProductListItem } from '@/modules/products/types'
import { createBrowserClient } from '@/lib/supabase/client'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const POPULAR_SEARCH_TAGS = ['Kemeja', 'Blus', 'Dress', 'Rok', 'Hijab', 'Koleksi Terbaru']

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const [supabase] = useState(() => createBrowserClient())

  const [searchQuery, setSearchQuery] = useState('')
  const [instantResults, setInstantResults] = useState<ProductListItem[]>([])
  const [isSearchingInstant, setIsSearchingInstant] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const overlayRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(isOpen, overlayRef, { onClose })

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('benangbaju_recent_searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }
  }, [isOpen])

  // Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open handled by parent or trigger toggle
          const searchBtn = document.querySelector(
            '[aria-label="Cari produk"]'
          ) as HTMLButtonElement
          searchBtn?.click()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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

  const saveRecentSearch = (query: string) => {
    try {
      const updated = [
        query,
        ...recentSearches.filter((q) => q.toLowerCase() !== query.toLowerCase()),
      ].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('benangbaju_recent_searches', JSON.stringify(updated))
    } catch {
      // Ignore storage errors
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('benangbaju_recent_searches')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    saveRecentSearch(trimmed)
    logSearchAction(trimmed, instantResults.length).catch(() => {})
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    onClose()
  }

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag)
    saveRecentSearch(tag)
    logSearchAction(tag, 0).catch(() => {})
    router.push(`/search?q=${encodeURIComponent(tag)}`)
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
            className="w-full max-w-2xl bg-white p-6 md:p-8 shadow-2xl relative border border-t-2 border-t-brand-accent border-neutral-100 rounded-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-brand-black transition-colors"
              aria-label="Tutup pencarian"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                    Cari Koleksi
                  </span>
                  <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black">
                    Pencarian Produk
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-1 rounded hidden sm:inline-block">
                  ⌘K / Ctrl+K
                </span>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  label="Kata kunci"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan kata kunci produk (cth: kemeja, blus, rok)..."
                  className="w-full bg-transparent border-none text-xl md:text-2xl font-sans font-light text-brand-black placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                  rightIcon={
                    <button type="submit" aria-label="Cari produk">
                      <Search className="h-4 w-4 text-brand-accent" />
                    </button>
                  }
                  autoFocus
                />
              </form>

              {/* Popular Search Tags & Recent Searches when query is empty */}
              {searchQuery.trim().length < 2 && (
                <div className="space-y-4 pt-2 border-t border-neutral-100">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-neutral-400">
                          <History className="h-3 w-3" />
                          <span className="text-[10px] font-heading font-medium uppercase tracking-wider">
                            Pencarian Terakhir
                          </span>
                        </div>
                        <button
                          onClick={clearRecentSearches}
                          className="text-[9px] text-neutral-400 hover:text-red-500 font-sans transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((item) => (
                          <button
                            key={item}
                            onClick={() => handleSelectTag(item)}
                            className="text-[11px] font-sans bg-neutral-100 hover:bg-brand-accent/10 hover:text-brand-accent text-neutral-700 px-3 py-1 rounded-full transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-neutral-400">
                      <Sparkles className="h-3 w-3 text-brand-accent" />
                      <span className="text-[10px] font-heading font-medium uppercase tracking-wider">
                        Pencarian Populer
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleSelectTag(tag)}
                          className="text-[11px] font-sans bg-brand-cream hover:bg-brand-accent hover:text-white border border-brand-accent/20 text-brand-black px-3 py-1 rounded-full transition-all duration-200"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {searchQuery.trim().length >= 2 && (
                <div className="border border-neutral-100 bg-neutral-50/50 p-4 -mt-2 space-y-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                      Hasil Pencarian Instan
                    </span>
                    {isSearchingInstant && (
                      <div className="flex items-center space-x-1.5 text-brand-accent">
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
                            className="flex items-center space-x-3 p-2 bg-white border border-neutral-100 hover:border-brand-accent/50 transition-all duration-200 group"
                          >
                            <div className="relative aspect-[3/4] w-10 bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0">
                              {primaryImg ? (
                                <Image
                                  src={getProxiedImageUrl(primaryImg)}
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
                              <h4 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-brand-black truncate group-hover:text-brand-accent transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-[10px] font-sans font-medium text-neutral-500 mt-0.5">
                                {formatIDR(minPrice)}
                              </p>
                            </div>
                            <div className="pr-2 text-neutral-300 group-hover:text-brand-accent transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Link>
                        )
                      })}

                      <button
                        onClick={handleSearchSubmit}
                        className="w-full pt-2 pb-1 text-[10px] uppercase tracking-widest font-heading font-semibold text-brand-accent hover:text-brand-black transition-colors"
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
