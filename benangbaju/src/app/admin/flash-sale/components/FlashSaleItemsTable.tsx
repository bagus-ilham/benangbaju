import React from 'react'
import { HandDrawnIcon } from '@/shared/components'
import { formatMYR } from '@/lib/utils'
import type { FlashSaleFormItem } from './FlashSaleFormModal'

interface FlashSaleItemsTableProps {
  items: FlashSaleFormItem[]
  handleUpdateItemField: (
    idx: number,
    field: keyof FlashSaleFormItem,
    value: number | null
  ) => void
  handleRemoveItem: (idx: number) => void
  targetMarket?: 'ALL' | 'ID' | 'MY'
}

export function FlashSaleItemsTable({
  items,
  handleUpdateItemField,
  handleRemoveItem,
  targetMarket = 'ALL',
}: FlashSaleItemsTableProps): React.JSX.Element {
  const showID = targetMarket === 'ALL' || targetMarket === 'ID'
  const showMY = targetMarket === 'ALL' || targetMarket === 'MY'

  return (
    <div className="border border-neutral-200 bg-neutral-50/50 rounded-xl overflow-hidden">
      {items.length === 0 ? (
        <p className="text-center text-neutral-400 py-6 text-[10px] italic uppercase tracking-wider">
          Belum ada produk untuk promo ini
        </p>
      ) : (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left">
            <thead className="bg-neutral-100 border-b border-neutral-200 text-[9px] uppercase tracking-widest text-neutral-500 font-bold sticky top-0">
              <tr>
                <th className="py-2 px-3">Produk & Varian</th>
                {showID && <th className="py-2 px-3">Harga 🇮🇩 (Rp)</th>}
                {showMY && <th className="py-2 px-3">Harga 🇲🇾 (RM)</th>}
                <th className="py-2 px-3">Kuota</th>
                <th className="py-2 px-3">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-[11px] font-medium bg-brand-cream">
              {items.map((it, idx) => (
                <tr key={it.variant_id}>
                  <td className="py-2 px-3">
                    <span className="block font-bold text-neutral-800 line-clamp-1">
                      {it.prodName}
                    </span>
                    <span className="text-[9px] text-neutral-500 uppercase">{it.name}</span>
                  </td>
                  {showID && (
                    <td className="py-2 px-3">
                      <div className="text-[9px] text-neutral-400 line-through mb-1">
                        Rp {it.original_price.toLocaleString('id-ID')}
                      </div>
                      <input
                        type="number"
                        className="w-24 border border-neutral-200 p-1 outline-none focus:border-brand-blue-stroke text-[10px] rounded-lg"
                        value={it.sale_price}
                        onChange={(e) =>
                          handleUpdateItemField(idx, 'sale_price', Number(e.target.value))
                        }
                      />
                    </td>
                  )}
                  {showMY && (
                    <td className="py-2 px-3">
                      {it.original_price_myr && it.original_price_myr > 0 ? (
                        <>
                          <div className="text-[9px] text-emerald-700/70 line-through mb-1">
                            {formatMYR(it.original_price_myr)}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="RM"
                            className="w-20 border border-emerald-200 bg-white p-1 outline-none focus:border-emerald-600 text-[10px] rounded-lg"
                            value={it.sale_price_myr ?? ''}
                            onChange={(e) =>
                              handleUpdateItemField(
                                idx,
                                'sale_price_myr',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                          />
                        </>
                      ) : (
                        <span className="text-[9px] text-amber-700 italic">
                          Belum ada harga RM
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      className="w-16 border border-neutral-200 p-1 outline-none focus:border-brand-blue-stroke text-[10px] rounded-lg"
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
                      <HandDrawnIcon name="trash" className="h-3 w-3" />
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
