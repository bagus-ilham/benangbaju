import React from 'react'
import Image from 'next/image'
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
        <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-plum">
          Kategori
        </h3>
        {(categorySlug || searchQuery) && (
          <button
            onClick={handleClearAll}
            className="text-[9px] font-sans font-bold uppercase tracking-widest text-neutral-500 hover:text-brand-plum"
          >
            Reset
          </button>
        )}
      </div>

      <ul className="space-y-2 border-b border-neutral-200/60 pb-6">
        <li>
          <button
            onClick={() => handleCategorySelect(null)}
            className={cn(
              'text-xs font-sans tracking-wide hover:text-brand-blue text-left w-full py-1 transition-colors flex items-center gap-2',
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
                onClick={() => handleCategorySelect(cat.slug)}
                className={cn(
                  'text-xs font-sans tracking-wide hover:text-brand-blue text-left w-full py-1 transition-colors flex items-center gap-2',
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
    </aside>
  )
}
