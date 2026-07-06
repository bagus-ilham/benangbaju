'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Truck, Plus, Check } from 'lucide-react'
import { Button, Textarea } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
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
}: CheckoutAddressFormProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      {/* Address Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-black flex items-center">
            <MapPin size={14} className="mr-2 text-neutral-500" /> Alamat Pengiriman
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddNewAddress}
            className="inline-flex items-center text-[11px] text-neutral-600 hover:text-brand-black font-heading font-medium uppercase tracking-wider transition-colors duration-200"
          >
            <Plus size={12} className="mr-1" /> Tambah Alamat
          </motion.button>
        </div>

        {addressesLoading ? (
          <div className="h-24 bg-neutral-100 animate-pulse rounded-none" />
        ) : addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {/* Selected Address Display */}
            {selectedAddress ? (
              <motion.div
                layoutId="selectedAddressBox"
                className="border border-brand-gold bg-brand-gold-muted/10 p-4 relative rounded-none shadow-sm"
              >
                <p className="font-heading font-semibold text-xs text-brand-gold uppercase tracking-wider">
                  {selectedAddress.label} (Pilihan)
                </p>
                <p className="font-sans font-medium text-neutral-700 mt-1.5">
                  {selectedAddress.recipient_name} | {selectedAddress.phone}
                </p>
                <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
                  {selectedAddress.full_address}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                  {selectedAddress.district_name}, {selectedAddress.city_name},{' '}
                  {selectedAddress.province_name} {selectedAddress.postal_code}
                </p>
              </motion.div>
            ) : (
              <p className="text-sm text-red-500 font-medium">
                Harap pilih atau tambahkan alamat baru
              </p>
            )}

            {/* Other Addresses */}
            {addresses.length > 1 && (
              <div className="border border-neutral-200 p-4 space-y-3 bg-white">
                <p className="text-[10px] text-neutral-400 font-heading font-medium uppercase tracking-widest">
                  Pilih Alamat Lain:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {addresses
                    .filter((a) => a.id !== selectedAddress?.id)
                    .map((address) => (
                      <motion.div
                        whileHover={{ y: -1, borderColor: '#171717' }}
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
                        className="p-3 border border-neutral-200 text-xs cursor-pointer bg-white transition-all duration-200"
                      >
                        <p className="font-heading font-medium text-[10px] text-brand-black uppercase tracking-wider">
                          {address.label}
                        </p>
                        <p className="font-sans text-neutral-700 mt-1 font-medium">
                          {address.recipient_name}
                        </p>
                        <p className="text-neutral-500 truncate mt-0.5 text-[11px]">
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
            <p className="text-xs text-neutral-400 mb-3">Belum ada alamat pengiriman.</p>
            <Button
              onClick={onAddNewAddress}
              variant="outline"
              className="text-xs uppercase font-semibold"
            >
              Tambah Alamat Pertama
            </Button>
          </div>
        )}
      </div>

      {/* Shipping Method Section */}
      <div className="space-y-4 pt-4 border-t border-neutral-100">
        <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-black flex items-center">
          <Truck size={14} className="mr-2 text-neutral-500" /> Opsi Pengiriman
        </h2>

        {!selectedAddress ? (
          <p className="text-xs text-neutral-400 italic">
            Harap pilih alamat terlebih dahulu untuk menampilkan opsi pengiriman.
          </p>
        ) : shippingLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
            <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
          </div>
        ) : shippingOptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shippingOptions.map((option) => (
              <motion.div
                whileHover={{
                  y: -2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  borderColor: '#171717',
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
                className={`p-4 border cursor-pointer transition-all duration-300 relative rounded-none ${
                  selectedCourier?.id === option.id
                    ? 'border-brand-gold bg-brand-gold-muted/10 ring-1 ring-brand-gold'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-heading font-medium text-xs text-brand-black uppercase tracking-wider">
                    {option.courier_name}
                  </span>
                  <span className="font-sans font-bold text-xs text-brand-black">
                    {formatIDR(option.price)}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Estimasi tiba: {option.etd_min} - {option.etd_max} Hari
                </p>
                {selectedCourier?.id === option.id && (
                  <div className="absolute top-2 right-2 bg-brand-gold text-white rounded-full p-0.5">
                    <Check size={8} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-red-500 font-semibold">
            Pengiriman tidak tersedia untuk zona alamat Anda. Harap hubungi Admin.
          </p>
        )}
      </div>

      {/* Note Section */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <Textarea
          label="Catatan Pesanan"
          id="order-notes"
          placeholder="Tulis instruksi khusus (cth: ukuran tambahan, warna cadangan, dll)..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={200}
          rows={3}
          helperText={`${notes.length}/200 karakter`}
        />
      </div>
    </div>
  )
}
