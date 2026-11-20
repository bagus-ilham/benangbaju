/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
import React from 'react'
import { Button, HandDrawnIcon } from '@/shared/components'
import { formatApproxMYR, formatMYR } from '@/lib/utils'
import { useSiteSettings } from '@/shared/hooks/useSiteSettings'

interface OrderItemsListProps {
  order: any
  onOpenReviewModal: (item: any) => void
}

export function OrderItemsList({
  order,
  onOpenReviewModal,
}: OrderItemsListProps): React.JSX.Element {
  const isMalaysia =
    order.country_code === 'MY' ||
    order.order_shipping?.country_code === 'MY' ||
    order.shipping_address?.country_code === 'MY'
  const { myrExchangeRate } = useSiteSettings()
  const effectiveExchangeRate = order?.exchange_rate_at_order
    ? Number(order.exchange_rate_at_order)
    : myrExchangeRate

  return (
    <div className="border border-brand-plum/10 p-5 sm:p-6 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-blue-soft to-brand-gold" />
      <h2 className="text-base font-serif font-medium tracking-tight text-brand-plum border-b border-brand-plum/10 pb-3 flex items-center gap-2">
        <HandDrawnIcon name="shopping-bag" className="h-4 w-4 text-brand-plum" />
        <span>{isMalaysia ? 'Order Items' : 'Item Pesanan'}</span>
      </h2>
      <div className="divide-y divide-brand-plum/10">
        {order.order_items?.map((item: any) => (
          <div
            key={item.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-4"
          >
            <div className="min-w-0">
              <p className="font-serif font-medium text-base text-brand-plum truncate">
                {item.product_name}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {isMalaysia ? 'Variant:' : 'Varian:'} {item.variant_name} | SKU: {item.sku}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isMalaysia ? (
                  <>
                    {item.quantity} x{' '}
                    {item.unit_price_myr
                      ? formatMYR(Number(item.unit_price_myr))
                      : formatApproxMYR(item.price, effectiveExchangeRate)}
                  </>
                ) : (
                  <>
                    {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                  </>
                )}
              </p>
              {order.status === 'completed' && (
                <div className="mt-2.5">
                  {item.product_reviews ? (
                    <div className="text-xs font-semibold text-emerald-800 bg-emerald-50/90 px-3 py-1.5 border border-emerald-200 rounded-xl inline-block">
                      {isMalaysia ? 'Your Review' : 'Ulasan Anda'} ({item.product_reviews.rating}★): "{item.product_reviews.body}"
                    </div>
                  ) : (
                    <Button
                      onClick={() => onOpenReviewModal(item)}
                      variant="outline"
                      className="text-[10px] py-1.5 px-3.5 h-fit uppercase tracking-wider font-bold border-brand-plum/20 hover:bg-brand-blue-soft/50"
                    >
                      {isMalaysia ? 'Write Review' : 'Tulis Ulasan'}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right whitespace-nowrap">
              {isMalaysia ? (
                <p className="font-bold text-brand-plum">
                  {item.unit_price_myr
                    ? formatMYR(Number(item.unit_price_myr) * item.quantity)
                    : formatApproxMYR(item.subtotal, effectiveExchangeRate)}
                </p>
              ) : (
                <p className="font-bold text-brand-plum">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
