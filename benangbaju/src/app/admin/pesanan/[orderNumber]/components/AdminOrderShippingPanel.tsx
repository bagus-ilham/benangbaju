import React from 'react'
import { AdminPanel, Input } from '@/shared/components'
import { Check, X, Edit2 } from 'lucide-react'

interface AdminOrderShippingPanelProps {
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
  isEditingResi: boolean
  editResiNumber: string
  setEditResiNumber: (val: string) => void
  setIsEditingResi: (val: boolean) => void
  handleUpdateResi: () => void
  isUpdatingTracking: boolean
}

export function AdminOrderShippingPanel({
  orderShipping,
  isEditingResi,
  editResiNumber,
  setEditResiNumber,
  setIsEditingResi,
  handleUpdateResi,
  isUpdatingTracking,
}: AdminOrderShippingPanelProps): React.JSX.Element {
  return (
    <AdminPanel title="Alamat Pengiriman">
      {orderShipping ? (
        <div className="text-sm space-y-2 text-neutral-600 font-medium">
          <p className="font-bold text-neutral-800">
            {orderShipping.recipient_name} ({orderShipping.phone})
          </p>
          <p className="leading-relaxed">{orderShipping.full_address}</p>
          <p className="text-xs text-neutral-500">
            Kecamatan {orderShipping.district_name}, {orderShipping.city_name},{' '}
            {orderShipping.province_name} {orderShipping.postal_code}
          </p>
          <div className="pt-2 border-t border-neutral-100 mt-2 space-y-1 text-neutral-500 text-xs">
            <p>
              Kurir:{' '}
              <span className="font-bold text-neutral-700 uppercase">
                {orderShipping.courier_name}
              </span>
            </p>
            {orderShipping.tracking_number && (
              <div className="flex items-center gap-2">
                <p>No. Resi: </p>
                {isEditingResi ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editResiNumber}
                      onChange={(e) => setEditResiNumber(e.target.value)}
                      className="w-32 py-1"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateResi}
                      disabled={isUpdatingTracking}
                      className="text-green-600 hover:text-green-700 p-0.5"
                      title="Simpan"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setIsEditingResi(false)}
                      className="text-red-500 hover:text-red-600 p-0.5"
                      title="Batal"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 select-all">
                      {orderShipping.tracking_number}
                    </span>
                    <button
                      onClick={() => {
                        setEditResiNumber(orderShipping.tracking_number!)
                        setIsEditingResi(true)
                      }}
                      className="text-neutral-400 hover:text-brand-gold transition"
                      title="Edit Resi"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 italic">Data pengiriman tidak ditemukan.</p>
      )}
    </AdminPanel>
  )
}
