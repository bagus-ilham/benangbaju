'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { useAddUserAddress, useUpdateUserAddress, useDistrictSearch } from '@/hooks/useShipping'
import type { UserAddress, District } from '@/services/shipping'
import toast from 'react-hot-toast'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  addressToEdit?: UserAddress | null
}

export function AddressModal({ isOpen, onClose, userId, addressToEdit }: AddressModalProps) {
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

  // District autocomplete search
  const [districtSearch, setDistrictSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { data: districts, isLoading: searchLoading } = useDistrictSearch(districtSearch)

  const addAddressMutation = useAddUserAddress()
  const updateAddressMutation = useUpdateUserAddress()

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
      setDistrictSearch(`${addressToEdit.district_name}, ${addressToEdit.city_name}`)
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
      setDistrictSearch('')
    }
    setShowSuggestions(false)
  }, [addressToEdit, isOpen])

  // Handle click outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectDistrict = (district: District) => {
    setProvinceName(district.province_name)
    setCityName(district.city_name)
    setDistrictName(district.district_name)
    setPostalCode(district.postal_code || '')
    setZoneId(district.zone_id)
    setDistrictSearch(`${district.district_name}, ${district.city_name}`)
    setShowSuggestions(false)
  }

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

        {/* District Autocomplete Search */}
        <div className="relative" ref={suggestionsRef}>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Kecamatan atau Kota Pengiriman*
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none rounded-none transition duration-150"
            placeholder="Ketik minimal 2 huruf (cth: Kebayoran Baru)"
            value={districtSearch}
            onChange={(e) => {
              setDistrictSearch(e.target.value)
              setShowSuggestions(true)
            }}
            required
          />
          
          {showSuggestions && districtSearch.trim().length >= 2 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 shadow-lg max-h-60 overflow-y-auto rounded-none">
              {searchLoading ? (
                <div className="px-4 py-3 text-neutral-400 text-xs italic">Mencari kecamatan...</div>
              ) : districts && districts.length > 0 ? (
                districts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 text-xs transition duration-100"
                    onClick={() => handleSelectDistrict(d)}
                  >
                    <span className="font-semibold text-neutral-800">{d.district_name}</span>,{' '}
                    <span>{d.city_name}</span>, <span className="text-neutral-400">{d.province_name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-neutral-400 text-xs italic">Kecamatan tidak ditemukan</div>
              )}
            </div>
          )}
        </div>

        {/* Display Resolved Address Fields (Read-only for integrity) */}
        {districtName && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs space-y-1 text-neutral-600 rounded-none">
            <p><span className="font-semibold text-neutral-700">Provinsi:</span> {provinceName}</p>
            <p><span className="font-semibold text-neutral-700">Kota/Kabupaten:</span> {cityName}</p>
            <p><span className="font-semibold text-neutral-700">Kecamatan:</span> {districtName}</p>
            <p><span className="font-semibold text-neutral-700">Kode Pos:</span> {postalCode || '-'}</p>
          </div>
        )}

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
