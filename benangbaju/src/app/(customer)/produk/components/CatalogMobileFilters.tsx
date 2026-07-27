import React from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/modules/categories/types'

interface CatalogMobileFiltersProps {
  showMobileFilters: boolean
  setShowMobileFilters: (val: boolean) => void
  categories: Category[]
  categorySlug?: string
  handleCategorySelect: (slug: string | null) => void
  handleClearAll: () => void
}

export function CatalogMobileFilters({
  showMobileFilters,
  setShowMobileFilters,
  categories,
  categorySlug,
  handleCategorySelect,
  handleClearAll,
}: CatalogMobileFiltersProps): React.JSX.Element {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden',
          showMobileFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setShowMobileFilters(false)}
      />
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-brand-cream shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col font-sans',
          showMobileFilters ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-200/80">
          <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-brand-plum">
            Filter
          </h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 -mr-2 text-neutral-400 hover:text-brand-plum transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <div>
            <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-neutral-500 mb-4">
              Kategori
            </h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => {
                    handleCategorySelect(null)
                    setShowMobileFilters(false)
                  }}
                  className={cn(
                    'text-sm font-sans tracking-wide text-left w-full transition-colors flex items-center gap-2',
                    !categorySlug ? 'text-brand-plum font-bold' : 'text-neutral-500'
                  )}
                >
                  {!categorySlug && (
                    <div className="relative w-3.5 h-3.5 shrink-0">
                      <Image src="/svg/kancing-icon.svg" alt="Active" fill className="object-contain" />
                    </div>
                  )}
                  <span>Semua Kategori</span>
                </button>
              </li>
              {categories.map((cat) => {
                const isActive = categorySlug === cat.slug
                return (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        handleCategorySelect(cat.slug)
                        setShowMobileFilters(false)
                      }}
                      className={cn(
                        'text-sm font-sans tracking-wide text-left w-full transition-colors flex items-center gap-2',
                        isActive ? 'text-brand-plum font-bold' : 'text-neutral-500'
                      )}
                    >
                      {isActive && (
                        <div className="relative w-3.5 h-3.5 shrink-0">
                          <Image src="/svg/kancing-icon.svg" alt="Active" fill className="object-contain" />
                        </div>
                      )}
                      <span>{cat.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="p-5 border-t border-neutral-200/80 flex gap-3">
          <button
            onClick={() => {
              handleClearAll()
              setShowMobileFilters(false)
            }}
            className="flex-1 py-3 text-xs font-sans font-bold uppercase tracking-widest border border-neutral-200 text-neutral-600 hover:bg-neutral-100/50 rounded-xl"
          >
            Reset
          </button>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 py-3 bg-brand-blue text-brand-plum text-xs font-sans font-bold uppercase tracking-widest hover:opacity-90 rounded-xl"
          >
            Terapkan
          </button>
        </div>
      </div>
    </>
  )
}
