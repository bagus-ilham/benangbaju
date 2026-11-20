import React from 'react'
import { HandDrawnIcon } from '@/shared/components'
import { cn } from '@/lib/utils'
import type { Category } from '@/modules/categories/types'
import { useMarket } from '@/shared/stores/marketStore'

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
  const market = useMarket()
  const isMY = market === 'MY'

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
        <div className="flex items-center justify-between p-5 border-b border-brand-plum/10 bg-brand-gold/40">
          <h2 className="text-lg font-serif font-medium text-brand-plum tracking-tight">
            Filter
          </h2>
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="p-2 -mr-2 text-brand-plum/70 hover:text-brand-plum transition-colors"
            aria-label={isMY ? 'Close filter' : 'Tutup filter'}
          >
            <HandDrawnIcon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-plum/70 mb-3">
              {isMY ? 'Categories' : 'Kategori'}
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    handleCategorySelect(null)
                    setShowMobileFilters(false)
                  }}
                  className={cn(
                    'text-sm font-sans tracking-wide text-left w-full px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2',
                    !categorySlug
                      ? 'bg-brand-blue-soft/85 text-brand-plum font-bold shadow-2xs'
                      : 'text-neutral-600 hover:bg-brand-gold/40'
                  )}
                >
                  {!categorySlug && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-plum shrink-0" />
                  )}
                  <span>{isMY ? 'All Categories' : 'Semua Kategori'}</span>
                </button>
              </li>
              {categories.map((cat) => {
                const isActive = categorySlug === cat.slug
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        handleCategorySelect(cat.slug)
                        setShowMobileFilters(false)
                      }}
                      className={cn(
                        'text-sm font-sans tracking-wide text-left w-full px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2',
                        isActive
                          ? 'bg-brand-blue-soft/85 text-brand-plum font-bold shadow-2xs'
                          : 'text-neutral-600 hover:bg-brand-gold/40'
                      )}
                    >
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-plum shrink-0" />
                      )}
                      <span>{cat.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="p-5 border-t border-brand-plum/10 flex gap-3">
          <button
            type="button"
            onClick={() => {
              handleClearAll()
              setShowMobileFilters(false)
            }}
            className="flex-1 py-3 text-xs font-sans font-bold uppercase tracking-widest border border-brand-plum/20 text-brand-plum hover:bg-brand-gold/40 rounded-xl"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 py-3 bg-brand-blue text-brand-plum text-xs font-sans font-bold uppercase tracking-widest hover:opacity-90 rounded-xl"
          >
            {isMY ? 'Apply' : 'Terapkan'}
          </button>
        </div>
      </div>
    </>
  )
}
