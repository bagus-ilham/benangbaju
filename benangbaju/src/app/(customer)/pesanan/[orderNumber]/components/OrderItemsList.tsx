/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
import React from 'react'
import { Button } from '@/shared/components'

interface OrderItemsListProps {
  order: any
  onOpenReviewModal: (item: any) => void
}

export function OrderItemsList({
  order,
  onOpenReviewModal,
}: OrderItemsListProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200/80 p-5 sm:p-6 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold" />
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum border-b border-neutral-200/60 pb-2">
        Item Pesanan
      </h2>
      <div className="divide-y divide-neutral-200/60">
        {order.order_items?.map((item: any) => (
          <div
            key={item.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-4"
          >
            <div className="min-w-0">
              <p className="font-bold text-brand-plum truncate">{item.product_name}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Varian: {item.variant_name} | SKU: {item.sku}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
              </p>
              {order.status === 'completed' && (
                <div className="mt-2">
                  {item.product_reviews ? (
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-lg inline-block">
                      Ulasan Anda ({item.product_reviews.rating}⭐): "{item.product_reviews.body}"
                    </div>
                  ) : (
                    <Button
                      onClick={() => onOpenReviewModal(item)}
                      variant="outline"
                      className="text-[10px] py-1 px-3 h-fit uppercase tracking-wider font-bold border-neutral-300 hover:bg-brand-blue/10"
                    >
                      Tulis Ulasan
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right whitespace-nowrap">
              <p className="font-bold text-brand-plum">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
