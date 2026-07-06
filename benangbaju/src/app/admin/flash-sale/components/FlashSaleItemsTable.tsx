import React from 'react'
import { Trash2 } from 'lucide-react'
import type { FlashSaleFormItem } from './FlashSaleFormModal'

interface FlashSaleItemsTableProps {
  items: FlashSaleFormItem[]
  handleUpdateItemField: (idx: number, field: keyof FlashSaleFormItem, value: number) => void
  handleRemoveItem: (idx: number) => void
}

export function FlashSaleItemsTable({
  items,
  handleUpdateItemField,
  handleRemoveItem,
}: FlashSaleItemsTableProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 bg-neutral-50/50">
      {items.length === 0 ? (
        <p className="text-center text-neutral-400 py-6 text-[10px] italic uppercase tracking-wider">
          Belum ada produk untuk promo ini
        </p>
      ) : (
        <div className="overflow-x-auto max-h-60">
          <table className="w-full text-left">
            <thead className="bg-neutral-100 border-b border-neutral-200 text-[9px] uppercase tracking-widest text-neutral-500 font-bold sticky top-0">
              <tr>
                <th className="py-2 px-3">Produk & Varian</th>
                <th className="py-2 px-3">Harga Asli</th>
                <th className="py-2 px-3">Harga Sale</th>
                <th className="py-2 px-3">Kuota</th>
                <th className="py-2 px-3">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-[11px] font-medium bg-white">
              {items.map((it, idx) => (
                <tr key={it.variant_id}>
                  <td className="py-2 px-3">
                    <span className="block font-bold text-neutral-800 line-clamp-1">
                      {it.prodName}
                    </span>
                    <span className="text-[9px] text-neutral-500 uppercase">{it.name}</span>
                  </td>
                  <td className="py-2 px-3 text-neutral-500">
                    Rp {it.original_price.toLocaleString()}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      className="w-20 border border-neutral-200 p-1 outline-none focus:border-brand-gold text-[10px]"
                      value={it.sale_price}
                      onChange={(e) =>
                        handleUpdateItemField(idx, 'sale_price', Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      className="w-16 border border-neutral-200 p-1 outline-none focus:border-brand-gold text-[10px]"
                      value={it.quota}
                      onChange={(e) => handleUpdateItemField(idx, 'quota', Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-400 hover:text-red-600 p-1 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
