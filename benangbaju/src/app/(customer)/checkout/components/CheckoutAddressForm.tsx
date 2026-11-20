'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button, Textarea, HandDrawnIcon, MarketFlagIcon } from '@/shared/components'
import { formatIDR, formatMYR } from '@/lib/utils'
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
        <div className="flex items-center justify-between border-b border-brand-plum/10 pb-3">
          <h2 className="text-base font-serif font-medium tracking-tight text-brand-plum flex items-center gap-2">
            <HandDrawnIcon name="map-pin" className="h-4 w-4 text-brand-plum" />
            <span>{isMY ? 'Delivery Address' : 'Alamat Pengiriman'}</span>
          </h2>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddNewAddress}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] text-brand-plum bg-brand-blue-soft/60 hover:bg-brand-blue-soft font-sans font-semibold transition-colors duration-200 cursor-pointer"
          >
            <HandDrawnIcon name="plus" className="h-3 w-3" />
            <span>{isMY ? 'Add Address' : 'Tambah Alamat'}</span>
          </motion.button>
        </div>

        {addressesLoading ? (
          <div className="h-24 bg-brand-rose-soft/50 animate-pulse rounded-2xl" />
        ) : addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {/* Selected Address Display */}
            {selectedAddress ? (
              <motion.div
                layoutId="selectedAddressBox"
                className="border border-brand-blue-stroke/80 bg-brand-blue-soft/35 p-4 relative rounded-2xl shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans font-bold text-xs text-brand-plum uppercase tracking-wider">
                    {selectedAddress.label}{' '}
                    <span className="font-medium normal-case text-brand-plum/70">
                      {isMY ? '(Selected)' : '(Pilihan)'}
                    </span>
                  </p>
                  {isMalaysia && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <MarketFlagIcon market="MY" className="w-3.5 h-3.5" />
                      <span>Malaysia</span>
                    </span>
                  )}
                </div>
                <p className="font-sans font-bold text-brand-plum mt-1.5 text-xs">
                  {selectedAddress.recipient_name} | {selectedAddress.phone}
                </p>
                <p className="text-neutral-600 text-xs mt-1 leading-relaxed font-sans">
                  {selectedAddress.full_address}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1 font-sans">
                  {[selectedAddress.district_name, selectedAddress.city_name, selectedAddress.province_name]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  {selectedAddress.postal_code}
                  {isMalaysia ? ', Malaysia' : ''}
                </p>
              </motion.div>
            ) : (
              <p className="text-sm text-red-500 font-medium font-sans">
                {isMY ? 'Please select or add a delivery address' : 'Harap pilih atau tambahkan alamat baru'}
              </p>
            )}

            {/* Other Addresses */}
            {addresses.length > 1 && (
              <div className="border border-brand-plum/10 p-4 space-y-3 bg-white/60 rounded-2xl">
                <p className="text-[10px] text-neutral-400 font-sans font-bold uppercase tracking-widest">
                  {isMY ? 'Select Another Address:' : 'Pilih Alamat Lain:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {addresses
                    .filter((a) => a.id !== selectedAddress?.id)
                    .map((address) => (
                      <motion.div
                        whileHover={{ y: -1, borderColor: '#C0D8DD' }}
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
                        className="p-3.5 border border-brand-plum/10 text-xs cursor-pointer bg-brand-cream transition-all duration-200 rounded-xl hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-sans font-bold text-[10px] text-brand-plum uppercase tracking-wider">
                            {address.label}
                          </p>
                          {address.country_code === 'MY' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                              <MarketFlagIcon market="MY" className="w-3 h-3" />
                              <span>MY</span>
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
          <div className="text-center py-8 px-5 border border-dashed border-brand-plum/20 bg-brand-gold-soft/30 rounded-2xl">
            <p className="text-xs text-neutral-500 font-sans mb-4">
              {isMY ? 'You have not added a shipping address yet.' : 'Anda belum menambahkan alamat pengiriman.'}
            </p>
            <Button
              onClick={onAddNewAddress}
              variant="outline"
              className="text-xs uppercase font-semibold"
            >
              {isMY ? 'Add New Address' : 'Tambah Alamat Baru'}
            </Button>
          </div>
        )}
      </div>

      {/* International Terms Notice for Malaysia Orders */}
      {isMalaysia && (
        <div className="p-4 bg-brand-gold-soft/50 border border-brand-gold-stroke/60 rounded-2xl space-y-1.5 text-xs text-brand-plum font-sans">
          <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-brand-plum">
            <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-brand-plum/80" />
            <span>{isMY ? 'International Shipping Terms (DDU & Final Sale)' : 'Ketentuan Pengiriman Internasional (DDU & Final Sale)'}</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-brand-plum/85 space-y-1 leading-relaxed">
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
      <div className="space-y-4 pt-5 border-t border-brand-plum/10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-medium tracking-tight text-brand-plum flex items-center gap-2">
            <HandDrawnIcon name="truck" className="h-4 w-4 text-brand-plum" />
            <span>{isMY ? 'Shipping Options' : 'Opsi Pengiriman'}</span>
          </h2>
          {totalWeightGram > 0 && (
            <span className="text-[11px] text-neutral-500 font-sans font-medium bg-brand-gold-soft/50 px-2.5 py-0.5 rounded-full border border-brand-plum/10">
              {isMY ? 'Total Weight: ' : 'Total Berat: '}
              <span className="font-bold text-brand-plum">{(totalWeightGram / 1000).toFixed(2)} kg</span>
            </span>
          )}
        </div>

        {!selectedAddress ? (
          <p className="text-xs text-neutral-400 italic font-sans">
            {isMY ? 'Select a delivery address to view shipping options.' : 'Pilih alamat pengiriman untuk melihat opsi kurir.'}
          </p>
        ) : shippingLoading ? (
          <div className="space-y-2">
            <div className="h-14 bg-brand-rose-soft/50 animate-pulse rounded-2xl" />
            <div className="h-14 bg-brand-rose-soft/50 animate-pulse rounded-2xl" />
          </div>
        ) : shippingOptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shippingOptions.map((option) => {
              const isSelected = selectedCourier?.id === option.id
              return (
                <motion.div
                  whileHover={{
                    y: -2,
                    borderColor: '#C0D8DD',
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
                  className={`p-4 border cursor-pointer transition-all duration-200 relative rounded-2xl ${
                    isSelected
                      ? 'border-brand-blue-stroke bg-brand-blue-soft/45 ring-1 ring-brand-blue shadow-xs'
                      : 'border-brand-plum/10 bg-white/80 hover:border-brand-blue hover:bg-brand-cream'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="font-sans font-bold text-xs text-brand-plum uppercase tracking-wider">
                      {option.courier_name}
                    </span>
                    <div className="text-right shrink-0">
                      {isMalaysia ? (
                        <span className="font-sans font-bold text-xs text-brand-plum block">
                          {formatMYR(
                            option.price_myr != null
                              ? option.price_myr
                              : Number((option.price / myrExchangeRate).toFixed(2))
                          )}
                        </span>
                      ) : (
                        <span className="font-sans font-bold text-xs text-brand-plum block">
                          {formatIDR(option.price)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-neutral-500 font-sans">
                      {isMY
                        ? `Estimated delivery: ${option.etd_min} - ${option.etd_max} Days`
                        : `Estimasi tiba: ${option.etd_min} - ${option.etd_max} Hari`}
                    </p>
                    {isSelected && (
                      <div className="bg-brand-blue text-brand-plum rounded-full p-0.5 shrink-0">
                        <HandDrawnIcon name="check-circle" className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-red-500 font-semibold font-sans">
            {isMY
              ? 'Sorry, courier service is not available for this area. Please contact support.'
              : 'Mohon maaf, kurir belum tersedia untuk wilayah ini. Silakan hubungi admin kami.'}
          </p>
        )}
      </div>

      {/* Note Section */}
      <div className="space-y-2 pt-5 border-t border-brand-plum/10">
        <Textarea
          label={isMY ? 'Order Notes' : 'Catatan Pesanan'}
          id="order-notes"
          placeholder={
            isMY
              ? 'Special delivery instructions (optional)...'
              : 'Tulis instruksi khusus (cth: ukuran tambahan, warna cadangan, dll)...'
          }
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
