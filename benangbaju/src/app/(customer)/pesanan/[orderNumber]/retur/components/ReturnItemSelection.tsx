import React from 'react'

interface ReturnItemSelectionProps {
  orderItems: Array<{
    id: string
    product_name: string
    variant_name: string
    sku: string
    quantity: number
    price: number
  }>
  selectedItems: Record<string, boolean>
  quantities: Record<string, number>
  onToggleItem: (itemId: string) => void
  onQtyChange: (itemId: string, maxQty: number, val: number) => void
}

export function ReturnItemSelection({
  orderItems,
  selectedItems,
  quantities,
  onToggleItem,
  onQtyChange,
}: ReturnItemSelectionProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200/80 p-5 sm:p-6 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-gold to-brand-blue" />
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum border-b border-neutral-200/60 pb-2">
        Pilih Produk yang Ingin Dikembalikan*
      </h2>
      <div className="divide-y divide-neutral-200/60">
        {orderItems.map((item) => (
          <div key={item.id} className="py-4 flex items-start space-x-4">
            <input
              type="checkbox"
              id={`checkbox-${item.id}`}
              checked={!!selectedItems[item.id]}
              onChange={() => onToggleItem(item.id)}
              className="mt-1 w-4 h-4 border-neutral-300 accent-brand-plum focus:ring-0 rounded cursor-pointer"
            />
            <div className="flex-1 min-w-0 text-sm">
              <label
                htmlFor={`checkbox-${item.id}`}
                className="font-bold text-brand-plum cursor-pointer block"
              >
                {item.product_name}
              </label>
              <p className="text-xs text-neutral-500 mt-1">
                Varian: {item.variant_name} | SKU: {item.sku}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Jumlah Beli: {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
              </p>
            </div>

            {selectedItems[item.id] && (
              <div className="flex items-center space-x-2">
                <label className="text-xs text-neutral-500 font-semibold uppercase">
                  Jumlah Retur:
                </label>
                <input
                  type="number"
                  min="1"
                  max={item.quantity}
                  value={quantities[item.id] || 1}
                  onChange={(e) => onQtyChange(item.id, item.quantity, parseInt(e.target.value))}
                  className="w-16 px-2 py-1.5 border border-neutral-200 text-center text-sm outline-none focus:border-neutral-900 rounded-xl font-semibold"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
