'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { useAddUserAddress, useUpdateUserAddress, useDistrictSearch } from '@/hooks/useShipping'
import type { UserAddress } from '@/services/shipping'
import { createBrowserClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  addressToEdit?: UserAddress | null
}

const supabase = createBrowserClient()

const PROVINCES = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta', 'Banten',
  'Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Riau', 'Lampung', 'Aceh',
  'Jambi', 'Bengkulu', 'Kepulauan Riau', 'Kepulauan Bangka Belitung',
  'Kalimantan Barat', 'Kalimantan Timur', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Utara',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Maluku', 'Maluku Utara'
]

export function AddressModal({ isOpen, onClose, userId, addressToEdit }: AddressModalProps) : React.JSX.Element {
  const isEdit = !!addressToEdit

  // Form states
  const [label, setLabel] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [provinceName, setProvinceName] = useState('')
  const [cityName, setCityName] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [zoneId, setZoneId] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { data: searchResults } = useDistrictSearch(searchQuery)
  const skipProvinceFetchRef = useRef(false)

  const addAddressMutation = useAddUserAddress()
  const updateAddressMutation = useUpdateUserAddress()

  const justInitializedRef = useRef(false)

  // Initialize fields on open/edit change
  useEffect(() => {
    if (addressToEdit) {
      setLabel(addressToEdit.label)
      setRecipientName(addressToEdit.recipient_name)
      setPhone(addressToEdit.phone)
      setProvinceName(addressToEdit.province_name)
      setCityName(addressToEdit.city_name)
      setDistrictName(addressToEdit.district_name)
      setPostalCode(addressToEdit.postal_code)
      setFullAddress(addressToEdit.full_address)
      setZoneId(addressToEdit.zone_id)
      setIsDefault(addressToEdit.is_default)
      setSearchQuery(addressToEdit.district_name ? `${addressToEdit.district_name}, ${addressToEdit.city_name}` : '')
      setShowSuggestions(false)
      if (addressToEdit.province_name) {
        justInitializedRef.current = true
      }
    } else {
      setLabel('')
      setRecipientName('')
      setPhone('')
      setProvinceName('')
      setCityName('')
      setDistrictName('')
      setPostalCode('')
      setFullAddress('')
      setZoneId(null)
      setIsDefault(false)
      setSearchQuery('')
      setShowSuggestions(false)
      justInitializedRef.current = false
    }
  }, [addressToEdit, isOpen])

  // Fetch zone_id when provinceName changes
  useEffect(() => {
    if (skipProvinceFetchRef.current) {
      skipProvinceFetchRef.current = false
      return
    }

    if (!provinceName) {
      setZoneId(null)
      justInitializedRef.current = false
      return
    }

    if (justInitializedRef.current) {
      justInitializedRef.current = false
      return
    }

    const fetchZoneId = async () => {
      try {
        const { data, error } = await supabase
          .from('shipping_zone_coverage')
          .select('zone_id')
          .eq('province_name', provinceName)
          .maybeSingle()

        if (error) {
          console.error('Error fetching zone for province:', error)
          setZoneId(null)
        } else if (data) {
          setZoneId(data.zone_id)
        } else {
          setZoneId(null)
        }
      } catch (err) {
        console.error('Error fetching zone for province:', err)
        setZoneId(null)
      }
    }

    fetchZoneId()
  }, [provinceName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!label || !recipientName || !phone || !districtName || !provinceName || !cityName || !fullAddress) {
      toast.error('Harap isi semua kolom wajib')
      return
    }

    const addressData = {
      user_id: userId,
      label,
      recipient_name: recipientName,
      phone,
      province_name: provinceName,
      city_name: cityName,
      district_name: districtName,
      postal_code: postalCode,
      full_address: fullAddress,
      zone_id: zoneId,
      is_default: isDefault,
    }

    try {
      if (isEdit && addressToEdit) {
        await updateAddressMutation.mutateAsync({
          addressId: addressToEdit.id,
          userId,
          address: addressData,
        })
        toast.success('Alamat berhasil diperbarui')
      } else {
        await addAddressMutation.mutateAsync(addressData)
        toast.success('Alamat berhasil ditambahkan')
      }
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan alamat')
    }
  }

  const isSaving = addAddressMutation.isPending || updateAddressMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Ubah Alamat' : 'Tambah Alamat Baru'}>
      <form onSubmit={handleSubmit} className="space-y-5 text-sm font-sans">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Label Alamat (cth: Rumah, Kantor)*"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="cth: Rumah"
            required
          />
          <Input
            label="Nama Penerima*"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Nama lengkap penerima"
            required
          />
        </div>

        <Input
          label="Nomor Telepon Penerima*"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="cth: 08123456789"
          required
        />

        {/* Autocomplete district search */}
        <div className="relative">
          <Input
            label="Cari Kota / Kecamatan (Ketik min. 2 karakter)*"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            placeholder="Cari cth: Kebayoran Baru atau Bandung..."
            helperText="Pencarian otomatis untuk provinsi, kota, kecamatan, dan kode pos."
          />
          {showSuggestions && searchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-neutral-200 shadow-lg max-h-48 overflow-y-auto mt-1 font-sans text-xs">
              {searchResults.map((district) => (
                <div
                  key={district.id}
                  onClick={() => {
                    skipProvinceFetchRef.current = true
                    setProvinceName(district.province_name)
                    setCityName(district.city_name)
                    setDistrictName(district.district_name)
                    setPostalCode(district.postal_code || '')
                    setZoneId(district.zone_id)
                    setSearchQuery(`${district.district_name}, ${district.city_name}`)
                    setShowSuggestions(false)
                  }}
                  className="p-2.5 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                >
                  <p className="font-bold text-neutral-800">
                    {district.district_name}, {district.city_name}
                  </p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {district.province_name} {district.postal_code ? `• ${district.postal_code}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Province Select Dropdown */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70 transition-colors duration-200">
            Provinsi*
          </label>
          <select
            className="w-full bg-white text-xs px-4 py-3 border border-neutral-200 rounded-none text-brand-black transition-all duration-300 focus:border-brand-black focus:bg-neutral-50/50 outline-none focus:ring-1 focus:ring-brand-black"
            value={provinceName}
            onChange={(e) => setProvinceName(e.target.value)}
            required
          >
            <option value="">Pilih Provinsi</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* City and District inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Kota/Kabupaten*"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="cth: Jakarta Barat"
            required
          />
          <Input
            label="Kecamatan*"
            value={districtName}
            onChange={(e) => setDistrictName(e.target.value)}
            placeholder="cth: Kebayoran Baru"
            required
          />
        </div>

        {/* Postal Code input */}
        <Input
          label="Kode Pos"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="cth: 12110"
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Alamat Lengkap (Jalan, No. Rumah, RT/RW, Blok, Gg)*
          </label>
          <textarea
            className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none rounded-none transition duration-150 h-24 resize-none"
            placeholder="Tulis alamat detail..."
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center space-x-2 py-1">
          <input
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
          />
          <label htmlFor="isDefault" className="select-none text-neutral-700">
            Jadikan alamat utama (default)
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
