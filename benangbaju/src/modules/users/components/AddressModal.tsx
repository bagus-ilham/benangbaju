'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Button, Input, Textarea, Select, Checkbox } from '@/shared/components'
import { useAddUserAddress, useUpdateUserAddress } from '@/modules/shipping/hooks/useShipping'
import type { District, UserAddress } from '@/modules/shipping/types'
import toast from 'react-hot-toast'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import {
  INDONESIA_PROVINCES,
  MALAYSIA_STATES,
  SUPPORTED_COUNTRIES,
  type SupportedCountryCode,
} from '@/lib/constants'
import { normalizePhoneE164 } from '@/lib/utils/validation'
import {
  addressSchema,
  createEmptyAddressValues,
  lookupShippingZoneId,
  mapAddressToFormValues,
  type AddressFormValues,
} from './AddressModal.schema'
import { IndonesiaDistrictAutocomplete } from './IndonesiaDistrictAutocomplete'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  addressToEdit?: UserAddress | null
}

const TOUCH_OPTIONS = {
  shouldValidate: true,
  shouldDirty: true,
  shouldTouch: true,
} as const

export function AddressModal({
  isOpen,
  onClose,
  userId,
  addressToEdit,
}: AddressModalProps): React.JSX.Element {
  const isEdit = !!addressToEdit
  const market = useMarket()

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: createEmptyAddressValues('ID'),
  })

  const countryCode = (useWatch({ control, name: 'country_code' }) || 'ID') as SupportedCountryCode
  const isMY = market === 'MY' || countryCode === 'MY'
  const provinceName = useWatch({ control, name: 'province_name' })

  const [searchQuery, setSearchQuery] = useState('')
  const skipProvinceFetchRef = useRef(false)
  const justInitializedRef = useRef(false)

  const addAddressMutation = useAddUserAddress()
  const updateAddressMutation = useUpdateUserAddress()

  // Initialize fields on open/edit change
  useEffect(() => {
    if (!isOpen) return

    const defaultCountry: SupportedCountryCode = market === 'MY' ? 'MY' : 'ID'
    reset(mapAddressToFormValues(addressToEdit, defaultCountry))

    if (addressToEdit) {
      const initialCountry = addressToEdit.country_code === 'MY' ? 'MY' : 'ID'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(
        initialCountry === 'ID' && addressToEdit.district_name
          ? `${addressToEdit.district_name}, ${addressToEdit.city_name}`
          : ''
      )
      justInitializedRef.current = Boolean(addressToEdit.province_name)
    } else {
      setSearchQuery('')
      justInitializedRef.current = false
    }
  }, [addressToEdit, isOpen, market, reset])

  // Fetch zone_id when provinceName or countryCode changes
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

    let cancelled = false
    lookupShippingZoneId(countryCode, provinceName).then((zoneId) => {
      if (!cancelled) {
        setValue('zone_id', zoneId)
      }
    })
    return () => {
      cancelled = true
    }
  }, [countryCode, provinceName, setValue])

  const onSubmitForm = async (data: AddressFormValues) => {
    const normalizedPhone = normalizePhoneE164(data.phone, data.country_code)

    const resolvedZoneId =
      data.zone_id || (await lookupShippingZoneId(data.country_code, data.province_name))

    const addressData = {
      user_id: userId,
      label: data.label.trim(),
      recipient_name: data.recipient_name.trim(),
      phone: normalizedPhone,
      country_code: data.country_code,
      province_name: data.province_name.trim(),
      city_name: data.city_name.trim(),
      district_name: data.country_code === 'MY' ? null : data.district_name?.trim() || null,
      postal_code: data.postal_code.trim(),
      full_address: data.full_address.trim(),
      zone_id: resolvedZoneId,
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
    (district: District) => {
      if (countryCode !== 'ID' || provinceName !== district.province_name) {
        skipProvinceFetchRef.current = true
      }
      setValue('country_code', 'ID')
      setValue('province_name', district.province_name, TOUCH_OPTIONS)
      setValue('city_name', district.city_name, TOUCH_OPTIONS)
      setValue('district_name', district.district_name, TOUCH_OPTIONS)
      setValue('postal_code', district.postal_code || '', TOUCH_OPTIONS)
      setValue('zone_id', district.zone_id, TOUCH_OPTIONS)
      setSearchQuery(`${district.district_name}, ${district.city_name}`)
    },
    [setValue, countryCode, provinceName]
  )

  const handleCountrySwitch = (nextCode: SupportedCountryCode) => {
    if (countryCode === nextCode) return
    setValue('country_code', nextCode, { shouldValidate: true, shouldDirty: true })
    setValue('province_name', '')
    setValue('city_name', '')
    setValue('district_name', '')
    setValue('postal_code', '')
    setValue('zone_id', null)
    setSearchQuery('')
  }

  const isSaving = addAddressMutation.isPending || updateAddressMutation.isPending

  const provinceOptions =
    countryCode === 'MY'
      ? MALAYSIA_STATES.map((s) => ({ label: s, value: s }))
      : INDONESIA_PROVINCES.map((p) => ({ label: p, value: p }))

  const modalTitle = isEdit
    ? isMY
      ? 'Edit Address'
      : 'Ubah Alamat'
    : isMY
      ? 'Add New Address'
      : 'Tambah Alamat Baru'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 text-sm font-sans">
        {/* Country Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700">
            {isMY ? 'Destination Country*' : 'Negara Tujuan Pengiriman*'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_COUNTRIES.map((c) => {
              const isSelected = countryCode === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySwitch(c.code as SupportedCountryCode)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all',
                    isSelected
                      ? 'border-brand-blue-stroke bg-brand-blue/5 text-brand-blue-text shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 bg-white'
                  )}
                >
                  <span className="text-base">{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="label"
            render={({ field }) => (
              <Input
                {...field}
                label={isMY ? 'Address Label (e.g. Home, Office)*' : 'Label Alamat (cth: Rumah, Kantor)*'}
                placeholder={isMY ? 'e.g. Home' : 'cth: Rumah'}
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
                label={isMY ? 'Recipient Name*' : 'Nama Penerima*'}
                placeholder={isMY ? 'Recipient full name' : 'Nama lengkap penerima'}
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
              label={
                countryCode === 'MY'
                  ? isMY
                    ? 'Recipient Phone Number (Malaysia)*'
                    : 'Nomor Telepon Penerima (Malaysia)*'
                  : isMY
                    ? 'Recipient Phone Number (Indonesia)*'
                    : 'Nomor Telepon Penerima (Indonesia)*'
              }
              placeholder={
                countryCode === 'MY' ? 'cth: +60123456789 atau 012-3456789' : 'cth: 08123456789'
              }
              helperText={
                countryCode === 'MY'
                  ? isMY
                    ? 'Active WhatsApp number recommended for delivery notifications.'
                    : 'Gunakan nomor WhatsApp aktif untuk kemudahan konfirmasi pengiriman.'
                  : undefined
              }
              error={errors.phone?.message}
            />
          )}
        />

        {/* Autocomplete district search for Indonesia only */}
        {countryCode === 'ID' && (
          <IndonesiaDistrictAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSelectDistrict={handleSelectDistrict}
          />
        )}

        {/* Province / State Dropdown */}
        <Controller
          control={control}
          name="province_name"
          render={({ field }) => (
            <Select
              label={
                countryCode === 'MY'
                  ? isMY
                    ? 'State (Negeri)*'
                    : 'Negeri (State)*'
                  : isMY
                    ? 'Province*'
                    : 'Provinsi*'
              }
              value={field.value}
              onChange={field.onChange}
              options={provinceOptions}
              placeholder={
                countryCode === 'MY'
                  ? isMY
                    ? 'Select State'
                    : 'Pilih Negeri'
                  : isMY
                    ? 'Select Province'
                    : 'Pilih Provinsi'
              }
              error={errors.province_name?.message}
            />
          )}
        />

        {/* City and District inputs */}
        <div className={cn('grid gap-4', countryCode === 'MY' ? 'grid-cols-1' : 'grid-cols-2')}>
          <Controller
            control={control}
            name="city_name"
            render={({ field }) => (
              <Input
                {...field}
                label={
                  countryCode === 'MY'
                    ? isMY
                      ? 'City / Town*'
                      : 'Bandar / Daerah (City)*'
                    : isMY
                      ? 'City / Regency*'
                      : 'Kota/Kabupaten*'
                }
                placeholder={
                  countryCode === 'MY' ? 'cth: Shah Alam / Petaling Jaya' : 'cth: Jakarta Barat'
                }
                error={errors.city_name?.message}
              />
            )}
          />
          {countryCode === 'ID' && (
            <Controller
              control={control}
              name="district_name"
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  label="Kecamatan*"
                  placeholder="cth: Kebayoran Baru"
                  error={errors.district_name?.message}
                />
              )}
            />
          )}
        </div>

        {/* Postal Code input */}
        <Controller
          control={control}
          name="postal_code"
          render={({ field }) => (
            <Input
              {...field}
              label={
                countryCode === 'MY'
                  ? isMY
                    ? 'Postcode (5 digits)*'
                    : 'Poskod (5 digit)*'
                  : isMY
                    ? 'Postal Code (5 digits)*'
                    : 'Kode Pos (5 digit)*'
              }
              placeholder={countryCode === 'MY' ? 'cth: 50450' : 'cth: 12110'}
              helperText={
                countryCode === 'MY'
                  ? isMY
                    ? 'Delivery covers Peninsular & East Malaysia (01000–98999).'
                    : 'Mencakup Semenanjung, Sabah, Sarawak & Labuan (Poskod 01000–98999).'
                  : undefined
              }
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
              label={
                countryCode === 'MY'
                  ? isMY
                    ? 'Full Address (Unit / House No, Street, Building / Residential Area)*'
                    : 'Alamat Lengkap (No. Rumah, Jalan, Kawasan / Taman / Bangunan)*'
                  : isMY
                    ? 'Full Address (Street, House No, Unit / Block)*'
                    : 'Alamat Lengkap (Jalan, No. Rumah, RT/RW, Blok, Gg)*'
              }
              placeholder={
                countryCode === 'MY'
                  ? 'cth: No. 15 Jalan SS 2/55, Taman Bahagia...'
                  : 'Tulis alamat detail...'
              }
              helperText={
                countryCode === 'MY'
                  ? isMY
                    ? 'Export couriers cannot deliver to P.O. Box addresses.'
                    : 'Kurir ekspor tidak dapat mengirim ke P.O. Box atau Peti Surat.'
                  : undefined
              }
              error={errors.full_address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="is_default"
          render={({ field: { value, onChange } }) => (
            <Checkbox
              label={isMY ? 'Set as default address' : 'Jadikan alamat utama (default)'}
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="py-1"
            />
          )}
        />

        <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {isMY ? 'Cancel' : 'Batal'}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? isMY
                ? 'Saving...'
                : 'Menyimpan...'
              : isMY
                ? 'Save Address'
                : 'Simpan Alamat'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
