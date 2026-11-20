import React from 'react'
import { cn } from '@/lib/utils'
import type { Category } from '@/modules/categories/types'
import { useMarket } from '@/shared/stores/marketStore'

interface CatalogDesktopFiltersProps {
  categories: Category[]
  categorySlug?: string
  searchQuery?: string
  handleCategorySelect: (slug: string | null) => void
  handleClearAll: () => void
}

export function CatalogDesktopFilters({
  categories,
  categorySlug,
  searchQuery,
  handleCategorySelect,
  handleClearAll,
}: CatalogDesktopFiltersProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <aside className="hidden md:block w-52 flex-shrink-0">
      <div className="bg-brand-gold-soft/35 border border-brand-plum/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-brand-plum/10 pb-3">
          <h2 className="text-base font-serif font-medium text-brand-plum tracking-tight">
            {isMY ? 'Categories' : 'Kategori'}
          </h2>
          {(categorySlug || searchQuery) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-plum/65 hover:text-brand-plum transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <ul className="space-y-1.5">
          <li>
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className={cn(
                'text-xs font-sans tracking-wide text-left w-full px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer',
                !categorySlug
                  ? 'bg-brand-blue-soft/85 text-brand-plum font-bold shadow-2xs'
                  : 'text-neutral-600 hover:bg-brand-cream/80 hover:text-brand-plum'
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
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={cn(
                    'text-xs font-sans tracking-wide text-left w-full px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer',
                    isActive
                      ? 'bg-brand-blue-soft/85 text-brand-plum font-bold shadow-2xs'
                      : 'text-neutral-600 hover:bg-brand-cream/80 hover:text-brand-plum'
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
    </aside>
  )
}
