'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMarketStore, type Market } from '@/shared/stores/marketStore'
import { useHydrated } from '@/shared/hooks/useHydrated'
import { HandDrawnIcon } from '@/shared/components'
import { cn } from '@/lib/utils'

interface MarketSwitcherProps {
  variant?: 'compact' | 'full'
  isTransparentHome?: boolean
  className?: string
}

export function MarketSwitcher({
  variant = 'compact',
  isTransparentHome = false,
  className,
}: MarketSwitcherProps): React.JSX.Element {
  const isHydrated = useHydrated()
  const { market, setMarket } = useMarketStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!isHydrated) {
    return (
      <div className={cn('h-8 w-16 bg-neutral-100/50 rounded-full animate-pulse', className)} />
    )
  }

  const handleSelect = (selectedMarket: Market) => {
    setMarket(selectedMarket)
    setIsOpen(false)
  }

  if (variant === 'full') {
    return (
      <div className={cn('space-y-2 p-3 bg-brand-cream/80 border border-neutral-200/80 rounded-2xl', className)}>
        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-brand-plum">
          <span className="flex items-center gap-1.5">
            <HandDrawnIcon name="sparkles" className="h-3 w-3 text-brand-accent" /> Wilayah / Market
          </span>
          <span className="text-[9px] font-sans text-neutral-400">
            {market === 'MY' ? 'Mode Malaysia (EN)' : 'Mode Indonesia'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelect('ID')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all',
              market === 'ID'
                ? 'bg-brand-plum text-white border-brand-plum shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            )}
          >
            <span>🇮🇩</span>
            <span>Indonesia (Rp)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect('MY')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all',
              market === 'MY'
                ? 'bg-brand-plum text-white border-brand-plum shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            )}
          >
            <span>🇲🇾</span>
            <span>Malaysia (RM)</span>
          </button>
        </div>
        {market === 'MY' && (
          <p className="text-[9px] text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl leading-relaxed font-sans">
            🇲🇾 <strong>International Mode:</strong> Direct shipping from Bandung to West Malaysia. Estimasi harga ditampilkan dalam <strong>≈ RM</strong> dengan pembayaran QRIS / DuitNow.
          </p>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer select-none border',
          isTransparentHome
            ? 'bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs'
            : market === 'MY'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300/80 hover:bg-emerald-100 shadow-2xs'
              : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-brand-plum border-neutral-200/80'
        )}
        aria-label="Pilih Wilayah / Switch Country Market"
        aria-expanded={isOpen}
      >
        <span>{market === 'MY' ? '🇲🇾' : '🇮🇩'}</span>
        <span className="uppercase tracking-wider">{market === 'MY' ? 'MY · RM' : 'ID'}</span>
        <HandDrawnIcon
          name="chevron-down"
          className={cn(
            'h-2.5 w-2.5 transition-transform duration-200 opacity-60',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-48 bg-brand-cream border border-neutral-200/80 rounded-xl shadow-lg p-1.5 z-50 font-sans"
          >
            <div className="px-2.5 py-1.5 text-[9px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
              Pilih Wilayah / Region
            </div>
            <button
              type="button"
              onClick={() => handleSelect('ID')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer',
                market === 'ID'
                  ? 'bg-brand-plum/10 text-brand-plum font-bold'
                  : 'text-neutral-700 hover:bg-neutral-100'
              )}
            >
              <div className="flex items-center gap-2">
                <span>🇮🇩</span>
                <span>Indonesia (Rp)</span>
              </div>
              {market === 'ID' && (
                <HandDrawnIcon name="check" className="h-3 w-3 text-brand-plum" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSelect('MY')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer',
                market === 'MY'
                  ? 'bg-emerald-100 text-emerald-950 font-bold'
                  : 'text-neutral-700 hover:bg-neutral-100'
              )}
            >
              <div className="flex items-center gap-2">
                <span>🇲🇾</span>
                <span>Malaysia (≈ RM)</span>
              </div>
              {market === 'MY' && (
                <HandDrawnIcon name="check" className="h-3 w-3 text-emerald-800" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
