'use client'

import React from 'react'
import { HandDrawnIcon } from './HandDrawnIcon'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxButtons?: number
  className?: string
  showInfo?: boolean
  totalItems?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxButtons = 5,
  className,
  showInfo = false,
  totalItems,
}: PaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null

  const maxVisible = Math.min(maxButtons, totalPages)
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = startPage + maxVisible - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  const pages: number[] = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3',
        className
      )}
    >
      {showInfo && (
        <div className="text-xs font-sans text-neutral-500 font-medium">
          Menampilkan halaman <span className="font-bold text-brand-plum">{currentPage}</span> dari{' '}
          <span className="font-bold text-brand-plum">{totalPages}</span>
          {totalItems !== undefined && (
            <span className="ml-1 text-neutral-400">({totalItems} total data)</span>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2 mx-auto sm:mx-0">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-9 w-9 flex items-center justify-center border border-brand-plum/15 rounded-full text-brand-plum bg-brand-cream hover:bg-brand-blush/70 hover:border-brand-blush-stroke disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 shadow-2xs cursor-pointer"
          aria-label="Halaman sebelumnya"
          title="Halaman sebelumnya"
        >
          <HandDrawnIcon name="chevron-left" className="h-4 w-4" />
        </button>

        {/* First Page Quick Jump if window shifted far */}
        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="h-9 min-w-[36px] px-2.5 border border-brand-plum/15 rounded-full text-xs font-bold bg-brand-cream text-brand-plum hover:bg-brand-blush/70 hover:border-brand-blush-stroke transition-all duration-200 shadow-2xs cursor-pointer"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-1 text-xs text-brand-plum/45 font-bold select-none">...</span>
            )}
          </>
        )}

        {/* Sliding Page Number Buttons */}
        {pages.map((p) => {
          const isActive = p === currentPage
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'h-9 min-w-[36px] px-2.5 border rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-brand-plum text-brand-gold border-brand-plum shadow-sm scale-105'
                  : 'bg-brand-cream text-brand-plum border-brand-plum/15 hover:bg-brand-blush/70 hover:border-brand-blush-stroke shadow-2xs'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {p}
            </button>
          )
        })}

        {/* Last Page Quick Jump if window shifted far */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-1 text-xs text-brand-plum/45 font-bold select-none">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="h-9 min-w-[36px] px-2.5 border border-brand-plum/15 rounded-full text-xs font-bold bg-brand-cream text-brand-plum hover:bg-brand-blush/70 hover:border-brand-blush-stroke transition-all duration-200 shadow-2xs cursor-pointer"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-9 w-9 flex items-center justify-center border border-brand-plum/15 rounded-full text-brand-plum bg-brand-cream hover:bg-brand-blush/70 hover:border-brand-blush-stroke disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 shadow-2xs cursor-pointer"
          aria-label="Halaman berikutnya"
          title="Halaman berikutnya"
        >
          <HandDrawnIcon name="chevron-right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
