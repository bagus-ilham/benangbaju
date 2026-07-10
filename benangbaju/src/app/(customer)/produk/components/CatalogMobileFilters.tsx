import React from 'react'
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
          'fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col',
          showMobileFilters ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h3 className="text-xs font-heading font-bold uppercase tracking-widest text-brand-black">
            Filter
          </h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 -mr-2 text-neutral-400 hover:text-brand-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <div>
            <h4 className="text-[10px] font-heading font-semibold uppercase tracking-widest text-neutral-400 mb-4">
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
                    'text-sm font-sans tracking-wide text-left w-full',
                    !categorySlug ? 'text-brand-black font-semibold' : 'text-neutral-500'
                  )}
                >
                  Semua Kategori
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      handleCategorySelect(cat.slug)
                      setShowMobileFilters(false)
                    }}
                    className={cn(
                      'text-sm font-sans tracking-wide text-left w-full',
                      categorySlug === cat.slug
                        ? 'text-brand-black font-semibold'
                        : 'text-neutral-500'
                    )}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-5 border-t border-neutral-100 flex gap-3">
          <button
            onClick={() => {
              handleClearAll()
              setShowMobileFilters(false)
            }}
            className="flex-1 py-3 text-xs font-heading font-bold uppercase tracking-widest border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          >
            Reset
          </button>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 py-3 bg-brand-black text-white text-xs font-heading font-bold uppercase tracking-widest hover:bg-neutral-800"
          >
            Terapkan
          </button>
        </div>
      </div>
    </>
  )
}
