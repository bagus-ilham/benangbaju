import React from 'react'
import { Search } from 'lucide-react'
import type { VariantSimple } from './FlashSaleFormModal'

interface FlashSaleVariantSearchProps {
  variantSearch: string
  setVariantSearch: (val: string) => void
  filteredVariants: VariantSimple[]
  handleAddVariantItem: (v: VariantSimple) => void
}

export function FlashSaleVariantSearch({
  variantSearch,
  setVariantSearch,
  filteredVariants,
  handleAddVariantItem,
}: FlashSaleVariantSearchProps): React.JSX.Element {
  return (
    <div className="mb-4 border border-brand-gold/30 p-3 bg-brand-gold-muted/5 relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Cari SKU atau nama produk..."
          className="w-full pl-8 pr-3 py-2 border border-neutral-200 focus:border-brand-gold outline-none text-xs"
          value={variantSearch}
          onChange={(e) => setVariantSearch(e.target.value)}
          autoFocus
        />
      </div>
      {variantSearch.length > 0 && (
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
          {filteredVariants.map((v) => (
            <div
              key={v.id}
              className="flex justify-between items-center p-2 border border-neutral-100 bg-white hover:border-brand-gold transition cursor-pointer"
              onClick={() => handleAddVariantItem(v)}
            >
              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-brand-black">
                  {v.sku}
                </p>
                <p className="text-[10px] text-neutral-600 line-clamp-1">
                  {v.products?.name} - {v.name}
                </p>
              </div>
              <div className="text-right pl-2 shrink-0">
                <p className="text-[10px] font-bold text-neutral-800">
                  Rp {v.price.toLocaleString()}
                </p>
                <p className="text-[9px] text-neutral-400">Stok: {v.stock}</p>
              </div>
            </div>
          ))}
          {filteredVariants.length === 0 && (
            <p className="text-[10px] text-center py-2 text-neutral-400">Tidak ada varian cocok.</p>
          )}
        </div>
      )}
    </div>
  )
}
