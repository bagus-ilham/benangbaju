import React from 'react'

interface OrderShippingProps {
  orderShipping?: {
    recipient_name: string
    phone: string
    full_address: string
    district_name: string
    city_name: string
    province_name: string
    postal_code: string
    courier_name: string
    tracking_number?: string | null
  } | null
  notes?: string | null
}

export function OrderShippingSection({
  orderShipping,
  notes,
}: OrderShippingProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
        <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
          Informasi Pengiriman
        </h2>
        {orderShipping ? (
          <div className="text-sm space-y-2 text-neutral-600">
            <p className="font-semibold text-neutral-800">
              {orderShipping.recipient_name} ({orderShipping.phone})
            </p>
            <p>{orderShipping.full_address}</p>
            <p className="text-xs text-neutral-500 font-medium">
              {orderShipping.district_name}, {orderShipping.city_name},{' '}
              {orderShipping.province_name} {orderShipping.postal_code}
            </p>
            <div className="pt-2 text-xs border-t border-neutral-100 mt-2 space-y-1 text-neutral-500">
              <p>
                Kurir:{' '}
                <span className="font-semibold text-neutral-700 uppercase">
                  {orderShipping.courier_name}
                </span>
              </p>
              {orderShipping.tracking_number && (
                <p>
                  No. Resi:{' '}
                  <span className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 select-all">
                    {orderShipping.tracking_number}
                  </span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 italic">Data pengiriman tidak ditemukan.</p>
        )}
      </div>

      {notes && (
        <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-brand-cream/30 space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold">
            Catatan dari Anda
          </h3>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  )
}
