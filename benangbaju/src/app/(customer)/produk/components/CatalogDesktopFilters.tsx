import React from 'react'
import { cn } from '@/lib/utils'
import type { Category } from '@/modules/categories/types'

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
  return (
    <aside className="hidden md:block w-48 flex-shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
          Kategori
        </h3>
        {(categorySlug || searchQuery) && (
          <button
            onClick={handleClearAll}
            className="text-[9px] font-heading font-semibold uppercase tracking-widest text-neutral-400 hover:text-brand-black"
          >
            Reset
          </button>
        )}
      </div>

      <ul className="space-y-2 border-b border-neutral-100 pb-6">
        <li>
          <button
            onClick={() => handleCategorySelect(null)}
            className={cn(
              'text-xs font-sans tracking-wide hover:text-brand-black text-left w-full py-1',
              !categorySlug ? 'text-brand-black font-semibold' : 'text-neutral-500'
            )}
          >
            Semua Kategori
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <button
              onClick={() => handleCategorySelect(cat.slug)}
              className={cn(
                'text-xs font-sans tracking-wide hover:text-brand-black text-left w-full py-1',
                categorySlug === cat.slug ? 'text-brand-black font-semibold' : 'text-neutral-500'
              )}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
