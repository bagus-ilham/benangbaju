'use client'

import React, { useState, useEffect, useRef, useId, useCallback } from 'react'
import { Modal, Button, Input, Textarea, Select, Checkbox } from '@/shared/components'
import {
  useAddUserAddress,
  useUpdateUserAddress,
  useDistrictSearch,
} from '@/modules/shipping/hooks/useShipping'
import type { UserAddress } from '@/modules/shipping/types'
import { createBrowserClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'

const addressSchema = z.object({
  label: z.string().min(1, 'Label alamat wajib diisi (cth: Rumah)'),
  recipient_name: z.string().min(3, 'Nama penerima minimal 3 karakter'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit')
    .regex(/^[0-9+]+$/, 'Hanya angka yang diperbolehkan'),
  province_name: z.string().min(1, 'Provinsi wajib dipilih'),
  city_name: z.string().min(1, 'Kota wajib diisi'),
  district_name: z.string().min(1, 'Kecamatan wajib diisi'),
  postal_code: z
    .string()
    .min(5, 'Kode pos harus 5 digit')
    .regex(/^[0-9]+$/, 'Hanya angka yang diperbolehkan')
    .optional()
    .or(z.literal('')),
  full_address: z.string().min(10, 'Alamat lengkap minimal 10 karakter'),
  zone_id: z.string().nullable(),
  is_default: z.boolean(),
})

type AddressFormValues = z.infer<typeof addressSchema>

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  addressToEdit?: UserAddress | null
}

const supabase = createBrowserClient()

const PROVINCES = [
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'DI Yogyakarta',
  'Banten',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Riau',
  'Lampung',
  'Aceh',
  'Jambi',
  'Bengkulu',
  'Kepulauan Riau',
  'Kepulauan Bangka Belitung',
  'Kalimantan Barat',
  'Kalimantan Timur',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Utara',
  'Sulawesi Selatan',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
  'Papua Barat',
  'Maluku',
  'Maluku Utara',
]

export function AddressModal({
  isOpen,
  onClose,
  userId,
  addressToEdit,
}: AddressModalProps): React.JSX.Element {
  const isEdit = !!addressToEdit

  const {
    control,
    handleSubmit,
    setValue,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      recipient_name: '',
      phone: '',
      province_name: '',
      city_name: '',
      district_name: '',
      postal_code: '',
      full_address: '',
      zone_id: null,
      is_default: false,
    },
  })

  const provinceName = useWatch({
    control,
    name: 'province_name',
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const { data: searchResultsRes } = useDistrictSearch(searchQuery)
  const searchResults = searchResultsRes?.data || []

  const skipProvinceFetchRef = useRef(false)
  const listboxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const listboxId = useId()

  const addAddressMutation = useAddUserAddress()
  const updateAddressMutation = useUpdateUserAddress()

  const justInitializedRef = useRef(false)

  // Initialize fields on open/edit change
  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        reset({
          label: addressToEdit.label,
          recipient_name: addressToEdit.recipient_name,
          phone: addressToEdit.phone,
          province_name: addressToEdit.province_name,
          city_name: addressToEdit.city_name,
          district_name: addressToEdit.district_name,
          postal_code: addressToEdit.postal_code || '',
          full_address: addressToEdit.full_address,
          zone_id: addressToEdit.zone_id,
          is_default: addressToEdit.is_default,
        })
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearchQuery(
          addressToEdit.district_name
            ? `${addressToEdit.district_name}, ${addressToEdit.city_name}`
            : ''
        )
        setShowSuggestions(false)
        if (addressToEdit.province_name) {
          justInitializedRef.current = true
        }
      } else {
        reset({
          label: '',
          recipient_name: '',
          phone: '',
          province_name: '',
          city_name: '',
          district_name: '',
          postal_code: '',
          full_address: '',
          zone_id: null,
          is_default: false,
        })
        setSearchQuery('')
        setShowSuggestions(false)
        justInitializedRef.current = false
      }
      setFocusedIndex(-1)
    }
  }, [addressToEdit, isOpen, reset])

  // Fetch zone_id when provinceName changes
  useEffect(() => {
    if (skipProvinceFetchRef.current) {
      skipProvinceFetchRef.current = false
      return
    }

    if (!provinceName) {
      setValue('zone_id', null)
      justInitializedRef.current = false
      return
    }

    if (justInitializedRef.current) {
      justInitializedRef.current = false
      return
    }

    const fetchZone = async () => {
      try {
        const { data } = await supabase
          .from('shipping_zones')
          .select('id')
          .ilike('name', provinceName)
          .single()

        if (data) {
          setValue('zone_id', data.id)
        } else {
          setValue('zone_id', null)
        }
      } catch {
        setValue('zone_id', null)
      }
    }
    fetchZone()
  }, [provinceName, setValue])

  const onSubmitForm = async (data: AddressFormValues) => {
    const addressData = {
      user_id: userId,
      label: data.label,
      recipient_name: data.recipient_name,
      phone: data.phone,
      province_name: data.province_name,
      city_name: data.city_name,
      district_name: data.district_name,
      postal_code: data.postal_code || '',
      full_address: data.full_address,
      zone_id: data.zone_id,
      is_default: data.is_default,
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

  const handleSelectDistrict = useCallback(
    (district: (typeof searchResults)[0]) => {
      skipProvinceFetchRef.current = true
      setValue('province_name', district.province_name)
      setValue('city_name', district.city_name)
      setValue('district_name', district.district_name)
      setValue('postal_code', district.postal_code || '')
      setValue('zone_id', district.zone_id)
      setSearchQuery(`${district.district_name}, ${district.city_name}`)
      setShowSuggestions(false)
      setFocusedIndex(-1)
    },
    [setValue]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleSelectDistrict(searchResults[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setFocusedIndex(-1)
        break
    }
  }

  useEffect(() => {
    if (showSuggestions && focusedIndex >= 0 && listboxRef.current) {
      const optionEl = listboxRef.current.children[focusedIndex] as HTMLElement
      if (optionEl) {
        const listbox = listboxRef.current
        const optionTop = optionEl.offsetTop
        const optionBottom = optionTop + optionEl.offsetHeight
        const listboxTop = listbox.scrollTop
        const listboxBottom = listboxTop + listbox.clientHeight

        if (optionTop < listboxTop) {
          listbox.scrollTop = optionTop
        } else if (optionBottom > listboxBottom) {
          listbox.scrollTop = optionBottom - listbox.clientHeight
        }
      }
    }
  }, [focusedIndex, showSuggestions])

  const isSaving = addAddressMutation.isPending || updateAddressMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Ubah Alamat' : 'Tambah Alamat Baru'}>
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 text-sm font-sans">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="label"
            render={({ field }) => (
              <Input
                {...field}
                label="Label Alamat (cth: Rumah, Kantor)*"
                placeholder="cth: Rumah"
                error={errors.label?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="recipient_name"
            render={({ field }) => (
              <Input
                {...field}
                label="Nama Penerima*"
                placeholder="Nama lengkap penerima"
                error={errors.recipient_name?.message}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              {...field}
              label="Nomor Telepon Penerima*"
              placeholder="cth: 08123456789"
              error={errors.phone?.message}
            />
          )}
        />

        {/* Autocomplete district search */}
        <div className="relative">
          <Input
            ref={inputRef}
            label="Cari Kota / Kecamatan (Ketik min. 2 karakter)*"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
              setFocusedIndex(-1)
            }}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowSuggestions(true)
            }}
            onBlur={() => {
              // Delay to allow click on suggestion to register
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari cth: Kebayoran Baru atau Bandung..."
            helperText="Pencarian otomatis untuk provinsi, kota, kecamatan, dan kode pos."
            aria-expanded={showSuggestions && searchResults.length > 0}
            aria-autocomplete="list"
            aria-controls={showSuggestions ? listboxId : undefined}
            aria-activedescendant={
              focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined
            }
            role="combobox"
          />
          {showSuggestions && searchResults.length > 0 && (
            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              className="absolute z-10 w-full bg-white border border-neutral-200 shadow-lg max-h-48 overflow-y-auto mt-1 font-sans text-xs outline-none"
            >
              {searchResults.map((district, index) => (
                <div
                  key={district.id}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={focusedIndex === index}
                  onClick={() => handleSelectDistrict(district)}
                  onMouseMove={() => setFocusedIndex(index)}
                  className={cn(
                    'p-2.5 cursor-pointer border-b border-neutral-100 last:border-0 transition-colors',
                    focusedIndex === index ? 'bg-neutral-50' : ''
                  )}
                >
                  <p className="font-bold text-neutral-800">
                    {district.district_name}, {district.city_name}
                  </p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {district.province_name}{' '}
                    {district.postal_code ? `• ${district.postal_code}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* Invisible ARIA live region to announce results to screen readers */}
          <div aria-live="polite" className="sr-only">
            {showSuggestions ? `${searchResults.length} hasil ditemukan.` : ''}
          </div>
        </div>

        {/* Province Select Dropdown */}
        <Controller
          control={control}
          name="province_name"
          render={({ field }) => (
            <Select
              label="Provinsi*"
              value={field.value}
              onChange={field.onChange}
              options={PROVINCES.map((p) => ({ label: p, value: p }))}
              placeholder="Pilih Provinsi"
              error={errors.province_name?.message}
            />
          )}
        />

        {/* City and District inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="city_name"
            render={({ field }) => (
              <Input
                {...field}
                label="Kota/Kabupaten*"
                placeholder="cth: Jakarta Barat"
                error={errors.city_name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="district_name"
            render={({ field }) => (
              <Input
                {...field}
                label="Kecamatan*"
                placeholder="cth: Kebayoran Baru"
                error={errors.district_name?.message}
              />
            )}
          />
        </div>

        {/* Postal Code input */}
        <Controller
          control={control}
          name="postal_code"
          render={({ field }) => (
            <Input
              {...field}
              label="Kode Pos"
              placeholder="cth: 12110"
              error={errors.postal_code?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="full_address"
          render={({ field }) => (
            <Textarea
              {...field}
              label="Alamat Lengkap (Jalan, No. Rumah, RT/RW, Blok, Gg)*"
              placeholder="Tulis alamat detail..."
              error={errors.full_address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="is_default"
          render={({ field: { value, onChange } }) => (
            <Checkbox
              label="Jadikan alamat utama (default)"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="py-1"
            />
          )}
        />

        <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan Alamat'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
