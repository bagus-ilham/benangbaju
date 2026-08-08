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

  // Calculate sliding window range (maximum maxButtons, e.g. 5)
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
          Menampilkan halaman <span className="font-bold text-neutral-900">{currentPage}</span> dari{' '}
          <span className="font-bold text-neutral-900">{totalPages}</span>
          {totalItems !== undefined && (
            <span className="ml-1 text-neutral-400">({totalItems} total data)</span>
          )}
        </div>
      )}

      <div className="flex items-center space-x-1.5 mx-auto sm:mx-0">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-2 border border-neutral-200 rounded-lg text-neutral-700 bg-white hover:bg-neutral-100 hover:border-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition duration-150 shadow-2xs"
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
              className="h-8 min-w-[32px] px-2 border border-neutral-200 rounded-lg text-xs font-bold bg-white text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition duration-150 shadow-2xs"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-1 text-xs text-neutral-400 font-bold select-none">...</span>
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
                'h-8 min-w-[32px] px-2 border rounded-lg text-xs font-bold transition duration-150 shadow-2xs',
                isActive
                  ? 'bg-brand-plum text-white border-brand-plum shadow-sm'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
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
              <span className="px-1 text-xs text-neutral-400 font-bold select-none">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="h-8 min-w-[32px] px-2 border border-neutral-200 rounded-lg text-xs font-bold bg-white text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition duration-150 shadow-2xs"
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
          className="p-2 border border-neutral-200 rounded-lg text-neutral-700 bg-white hover:bg-neutral-100 hover:border-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition duration-150 shadow-2xs"
          aria-label="Halaman berikutnya"
          title="Halaman berikutnya"
        >
          <HandDrawnIcon name="chevron-right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
