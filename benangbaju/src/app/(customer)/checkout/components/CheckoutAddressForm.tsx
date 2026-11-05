'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button, Textarea, HandDrawnIcon } from '@/shared/components'
import { formatIDR, formatApproxMYR } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import type { UserAddress, ShippingOption } from '@/modules/shipping/types'

interface CheckoutAddressFormProps {
  addresses: UserAddress[]
  selectedAddress: UserAddress | null
  onSelectAddress: (addr: UserAddress) => void
  onAddNewAddress: () => void
  addressesLoading: boolean
  shippingOptions: ShippingOption[]
  selectedCourier: ShippingOption | null
  onSelectCourier: (courier: ShippingOption) => void
  shippingLoading: boolean
  notes: string
  onNotesChange: (notes: string) => void
  totalWeightGram?: number
  myrExchangeRate?: number
}

export function CheckoutAddressForm({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddNewAddress,
  addressesLoading,
  shippingOptions,
  selectedCourier,
  onSelectCourier,
  shippingLoading,
  notes,
  onNotesChange,
  totalWeightGram = 0,
  myrExchangeRate = 3600,
}: CheckoutAddressFormProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY' || selectedAddress?.country_code === 'MY'
  const isMalaysia = selectedAddress?.country_code === 'MY'

  return (
    <div className="space-y-8">
      {/* Address Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-plum flex items-center">
            <HandDrawnIcon name="map-pin" className="h-3.5 w-3.5 mr-2" /> {isMY ? "Delivery Address" : "Alamat Pengiriman"}
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddNewAddress}
            className="inline-flex items-center text-[11px] text-neutral-600 hover:text-brand-plum font-heading font-medium uppercase tracking-wider transition-colors duration-200"
          >
            <HandDrawnIcon name="plus" className="h-3 w-3 mr-1" /> {isMY ? "Add Address" : "Tambah Alamat"}
          </motion.button>
        </div>

        {addressesLoading ? (
          <div className="h-24 bg-neutral-100 animate-pulse rounded-2xl" />
        ) : addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {/* Selected Address Display */}
            {selectedAddress ? (
              <motion.div
                layoutId="selectedAddressBox"
                className="border border-brand-blue bg-brand-blue/10 p-4 relative rounded-2xl shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans font-bold text-xs text-brand-plum uppercase tracking-wider">
                    {selectedAddress.label} {isMY ? "(Selected)" : "(Pilihan)"}
                  </p>
                  {isMalaysia && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      🇲🇾 Malaysia (Semenanjung)
                    </span>
                  )}
                </div>
                <p className="font-sans font-bold text-brand-plum mt-1.5 text-xs">
                  {selectedAddress.recipient_name} | {selectedAddress.phone}
                </p>
                <p className="text-neutral-600 text-xs mt-1 leading-relaxed font-sans">
                  {selectedAddress.full_address}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 font-sans">
                  {[selectedAddress.district_name, selectedAddress.city_name, selectedAddress.province_name]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  {selectedAddress.postal_code}
                  {isMalaysia ? ', Malaysia' : ''}
                </p>
              </motion.div>
            ) : (
              <p className="text-sm text-red-500 font-medium font-sans">
                {isMY ? "Please select or add a delivery address" : "Harap pilih atau tambahkan alamat baru"}
              </p>
            )}

            {/* Other Addresses */}
            {addresses.length > 1 && (
              <div className="border border-neutral-200/80 p-4 space-y-3 bg-brand-cream rounded-2xl">
                <p className="text-[10px] text-neutral-400 font-sans font-bold uppercase tracking-widest">
                  {isMY ? "Select Another Address:" : "Pilih Alamat Lain:"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {addresses
                    .filter((a) => a.id !== selectedAddress?.id)
                    .map((address) => (
                      <motion.div
                        whileHover={{ y: -1, borderColor: '#94b2b9' }}
                        whileTap={{ scale: 0.98 }}
                        key={address.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectAddress(address)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelectAddress(address)
                          }
                        }}
                        className="p-3 border border-neutral-200/80 text-xs cursor-pointer bg-brand-cream transition-all duration-200 rounded-xl hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-sans font-bold text-[10px] text-brand-plum uppercase tracking-wider">
                            {address.label}
                          </p>
                          {address.country_code === 'MY' && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              🇲🇾 MY
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-neutral-700 mt-1 font-medium">
                          {address.recipient_name}
                        </p>
                        <p className="text-neutral-500 truncate mt-0.5 text-[11px] font-sans">
                          {address.full_address}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-neutral-200">
            <p className="text-xs text-neutral-400 mb-3">
              {isMY ? "You have not added a shipping address yet." : "Anda belum menambahkan alamat pengiriman."}
            </p>
            <Button
              onClick={onAddNewAddress}
              variant="outline"
              className="text-xs uppercase font-semibold"
            >
              {isMY ? "Add New Address" : "Tambah Alamat Baru"}
            </Button>
          </div>
        )}
      </div>

      {/* International Terms Notice for Malaysia Orders */}
      {isMalaysia && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1.5 text-xs text-amber-950 font-sans">
          <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-900">
            <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-amber-700" />
            <span>{isMY ? "International Shipping Terms (DDU & Final Sale)" : "Ketentuan Pengiriman Internasional (DDU & Final Sale)"}</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-amber-900/90 space-y-1 leading-relaxed">
            <li>
              {isMY ? <><strong>DDU (Delivered Duty Unpaid):</strong> Malaysian SST & import duties (if order CIF value exceeds De Minimis RM 500) are borne by the recipient upon parcel arrival.</> : <><strong>DDU (Delivered Duty Unpaid):</strong> Pajak SST & bea cukai Malaysia (apabila nilai pesanan melebihi De Minimis RM 500) ditanggung oleh penerima saat paket tiba.</>}
            </li>
            <li>
              {isMY ? <><strong>Final Sale:</strong> Cross-border orders are not eligible for self-service returns. If an item is damaged or incorrect, contact Customer Care via WhatsApp.</> : <><strong>Final Sale:</strong> Pesanan lintas batas tidak dapat diretur mandiri. Bila produk rusak/salah kirim, hubungi Customer Care melalui WhatsApp.</>}
            </li>
          </ul>
        </div>
      )}

      {/* Shipping Method Section */}
      <div className="space-y-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-sans font-bold text-brand-plum flex items-center">
            <HandDrawnIcon name="truck" className="h-3.5 w-3.5 mr-2" /> {isMY ? "Shipping Options" : "Opsi Pengiriman"}
          </h2>
          {totalWeightGram > 0 && (
            <span className="text-[11px] text-neutral-500 font-sans font-medium">
              {isMY ? "Total Weight: " : "Total Berat: "}<span className="font-bold text-brand-plum">{(totalWeightGram / 1000).toFixed(2)} kg</span>
            </span>
          )}
        </div>

        {!selectedAddress ? (
          <p className="text-xs text-neutral-400 italic font-sans">
            {isMY ? "Select a delivery address to view shipping options." : "Pilih alamat pengiriman untuk melihat opsi kurir."}
          </p>
        ) : shippingLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-neutral-100 animate-pulse rounded-xl" />
            <div className="h-12 bg-neutral-100 animate-pulse rounded-xl" />
          </div>
        ) : shippingOptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shippingOptions.map((option) => (
              <motion.div
                whileHover={{
                  y: -2,
                  borderColor: '#94b2b9',
                }}
                whileTap={{ scale: 0.99 }}
                key={option.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCourier(option)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectCourier(option)
                  }
                }}
                className={`p-4 border cursor-pointer transition-all duration-300 relative rounded-xl ${
                  selectedCourier?.id === option.id
                    ? 'border-brand-blue bg-brand-blue/10 ring-1 ring-brand-blue'
                    : 'border-neutral-200/80 bg-brand-cream hover:border-brand-blue'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-sans font-bold text-xs text-brand-plum uppercase tracking-wider">
                    {option.courier_name}
                  </span>
                  <div className="text-right">
                    <span className="font-sans font-bold text-xs text-brand-plum block">
                      {formatIDR(option.price)}
                    </span>
                    {isMalaysia && (
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        {formatApproxMYR(option.price, myrExchangeRate)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 font-sans">
                  {isMY ? `Estimated delivery: ${option.etd_min} - ${option.etd_max} Days` : `Estimasi tiba: ${option.etd_min} - ${option.etd_max} Hari`}
                </p>
                {selectedCourier?.id === option.id && (
                  <div className="absolute top-2 right-2 bg-brand-blue text-brand-plum rounded-full p-0.5">
                    <HandDrawnIcon name="check-circle" className="h-2.5 w-2.5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-red-500 font-semibold">
            {isMY ? "Sorry, courier service is not available for this area. Please contact support." : "Mohon maaf, kurir belum tersedia untuk wilayah ini. Silakan hubungi admin kami."}
          </p>
        )}
      </div>

      {/* Note Section */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <Textarea
          label={isMY ? "Order Notes" : "Catatan Pesanan"}
          id="order-notes"
          placeholder={isMY ? "Special delivery instructions (optional)..." : "Tulis instruksi khusus (cth: ukuran tambahan, warna cadangan, dll)..."}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={200}
          rows={3}
          helperText={isMY ? `${notes.length}/200 characters` : `${notes.length}/200 karakter`}
        />
      </div>
    </div>
  )
}
