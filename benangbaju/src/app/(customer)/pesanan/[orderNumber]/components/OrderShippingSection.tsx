import React from 'react'
import { HandDrawnIcon, MarketFlagIcon } from '@/shared/components'
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
  const isEastMalaysia = /sabah|sarawak|labuan/i.test(orderShipping?.province_name || '')
  const trackingNumbers = parseTrackingNumbers(orderShipping?.tracking_number)

  return (
    <div className="space-y-6">
      <div className="border border-brand-plum/10 p-5 sm:p-6 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
        <div className="card-accent-bar" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-plum/10 pb-3">
          <h2 className="text-base font-serif font-medium tracking-tight text-brand-plum flex items-center gap-2">
            <HandDrawnIcon name="truck" className="h-4 w-4 text-brand-plum" />
            <span>{isMalaysia ? 'Shipping Information' : 'Informasi Pengiriman'}</span>
          </h2>
          {isMalaysia && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <MarketFlagIcon market="MY" className="w-3.5 h-3.5" />
              <span>{isEastMalaysia ? 'Malaysia (Timur)' : 'Malaysia (Semenanjung)'}</span>
            </span>
          )}
        </div>
        {orderShipping ? (
          <div className="text-sm space-y-2 text-neutral-600">
            <p className="font-bold text-brand-plum">
              {orderShipping.recipient_name} ({orderShipping.phone})
            </p>
            <p className="leading-relaxed">{orderShipping.full_address}</p>
            <p className="text-xs text-neutral-500 font-medium font-sans">
              {[
                orderShipping.district_name,
                orderShipping.city_name,
                `${orderShipping.province_name} ${orderShipping.postal_code}`,
                isMalaysia ? 'Malaysia' : null,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <div className="pt-3 text-xs border-t border-brand-plum/10 mt-3 space-y-2 text-neutral-600">
              <p>
                {isMalaysia ? 'Courier:' : 'Kurir:'}{' '}
                <span className="font-semibold text-brand-plum uppercase">
                  {orderShipping.courier_name}
                </span>
              </p>
              {trackingNumbers.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-neutral-500 font-medium block">
                    {isMalaysia ? 'Tracking Number(s):' : 'No. Resi Pelacakan:'}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-brand-blue-soft/40 text-brand-plum font-mono text-xs font-bold rounded-xl border border-brand-plum/15 shadow-2xs hover:border-brand-blue transition-all duration-200"
                        >
                          <span>{trackingNo}</span>
                          <HandDrawnIcon name="external-link" className="h-3 w-3 text-brand-plum/60" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              ) : orderShipping.tracking_number ? (
                <p className="flex items-center gap-1.5 flex-wrap">
                  <span>{isMalaysia ? 'Tracking Number:' : 'No. Resi:'}</span>
                  <span className="font-mono font-bold text-brand-plum bg-brand-gold/50 border border-brand-plum/10 px-2.5 py-0.5 rounded-lg select-all">
                    {orderShipping.tracking_number}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 italic">
            {isMalaysia ? 'Shipping data not found.' : 'Data pengiriman tidak ditemukan.'}
          </p>
        )}
      </div>

      {notes && (
        <div className="border border-brand-plum/10 p-5 bg-brand-gold/35 space-y-2 rounded-2xl shadow-xs">
          <h2 className="text-sm font-serif font-medium tracking-tight text-brand-plum">
            {isMalaysia ? 'Order Notes' : 'Catatan dari Anda'}
          </h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  )
}
