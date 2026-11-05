import React from 'react'
import { HandDrawnIcon } from '@/shared/components'
import { parseTrackingNumbers, getCourierTrackingUrl } from '@/lib/utils'

interface OrderShippingProps {
  orderShipping?: {
    recipient_name: string
    phone: string
    full_address: string
    district_name?: string | null
    city_name: string
    province_name: string
    postal_code: string
    courier_name: string
    tracking_number?: string | null
    country_code?: string | null
  } | null
  notes?: string | null
}

export function OrderShippingSection({
  orderShipping,
  notes,
}: OrderShippingProps): React.JSX.Element {
  const isMalaysia = orderShipping?.country_code === 'MY'
  const trackingNumbers = parseTrackingNumbers(orderShipping?.tracking_number)

  return (
    <div className="space-y-6">
      <div className="border border-neutral-200/80 p-5 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold" />
        <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
          <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum">
            Informasi Pengiriman
          </h2>
          {isMalaysia && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
              🇲🇾 Malaysia (Semenanjung)
            </span>
          )}
        </div>
        {orderShipping ? (
          <div className="text-sm space-y-2 text-neutral-600">
            <p className="font-bold text-brand-plum">
              {orderShipping.recipient_name} ({orderShipping.phone})
            </p>
            <p>{orderShipping.full_address}</p>
            <p className="text-xs text-neutral-600 font-medium font-sans">
              {[
                orderShipping.district_name,
                orderShipping.city_name,
                `${orderShipping.province_name} ${orderShipping.postal_code}`,
                isMalaysia ? 'Malaysia' : null,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <div className="pt-2 text-xs border-t border-neutral-100 mt-2 space-y-2 text-neutral-600">
              <p>
                Kurir:{' '}
                <span className="font-semibold text-neutral-700 uppercase">
                  {orderShipping.courier_name}
                </span>
              </p>
              {trackingNumbers.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-neutral-500 font-medium block">
                    No. Resi Pelacakan:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {trackingNumbers.map((trackingNo) => {
                      const trackingUrl = getCourierTrackingUrl(
                        orderShipping.courier_name,
                        trackingNo
                      )
                      return (
                        <a
                          key={trackingNo}
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-50 text-brand-plum font-mono text-xs font-bold rounded-lg border border-neutral-300 shadow-2xs hover:border-brand-plum transition-all duration-200"
                        >
                          <span>{trackingNo}</span>
                          <HandDrawnIcon name="external-link" className="h-3 w-3 text-neutral-400" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              ) : orderShipping.tracking_number ? (
                <p>
                  No. Resi:{' '}
                  <span className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 select-all">
                    {orderShipping.tracking_number}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-600 italic">Data pengiriman tidak ditemukan.</p>
        )}
      </div>

      {notes && (
        <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-brand-cream/30 space-y-2 rounded-2xl">
          <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-accent">
            Catatan dari Anda
          </h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  )
}
