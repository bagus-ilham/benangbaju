'use client'

import React, { useState, useEffect, useRef, useId, useCallback } from 'react'
import { Modal, Button, Input, Textarea, Select, Checkbox } from '@/shared/components'
import {
  useAddUserAddress,
  useUpdateUserAddress,
  useDistrictSearch,
} from '@/modules/shipping/hooks/useShipping'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { UserAddress } from '@/modules/shipping/types'
import { createBrowserClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { useMarketStore } from '@/shared/stores/marketStore'
import {
  INDONESIA_PROVINCES,
  MALAYSIA_WEST_STATES,
  SUPPORTED_COUNTRIES,
  type SupportedCountryCode,
} from '@/lib/constants'
import {
  isValidPhoneByCountry,
  normalizePhoneE164,
  validateMalaysiaWestPostalCode,
  hasPoBoxAddress,
  validatePostalCode,
} from '@/lib/utils/validation'

const addressSchema = z
  .object({
    country_code: z.enum(['ID', 'MY']),
    label: z.string().min(1, 'Label alamat wajib diisi (cth: Rumah)'),
    recipient_name: z.string().min(3, 'Nama penerima minimal 3 karakter'),
    phone: z.string().min(8, 'Nomor telepon minimal 8 digit'),
    province_name: z.string().min(1, 'Provinsi/Negeri wajib dipilih'),
    city_name: z.string().min(1, 'Kota/Bandar wajib diisi'),
    district_name: z.string().optional().nullable(),
    postal_code: z.string().min(1, 'Kode Pos/Poskod wajib diisi'),
    full_address: z.string().min(10, 'Alamat lengkap minimal 10 karakter'),
    zone_id: z.string().nullable(),
    is_default: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // 1. Phone validation by country
    if (!isValidPhoneByCountry(data.phone, data.country_code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message:
          data.country_code === 'MY'
            ? 'Format nomor Malaysia tidak valid (cth: +60123456789 atau 012-3456789)'
            : 'Format nomor Indonesia tidak valid (cth: 08123456789 atau +628123456789)',
      })
    }

    // 2. PO Box rejection (unsupported by crossborder couriers)
    if (hasPoBoxAddress(data.full_address)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['full_address'],
        message: 'Pengiriman tidak dapat dilakukan ke alamat P.O. Box atau Peti Surat',
      })
    }

    // 3. Country-specific rules
    if (data.country_code === 'ID') {
      if (!data.district_name || data.district_name.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['district_name'],
          message: 'Kecamatan wajib diisi untuk alamat Indonesia',
        })
      }
      if (!validatePostalCode(data.postal_code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['postal_code'],
          message: 'Kode pos Indonesia harus 5 digit angka',
        })
      }
    } else if (data.country_code === 'MY') {
      const pcResult = validateMalaysiaWestPostalCode(data.postal_code)
      if (!pcResult.valid) {
        if (pcResult.reason === 'east_malaysia') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['postal_code'],
            message:
              'Pengiriman saat ini hanya mencakup Semenanjung Malaysia (Poskod 01000–86999). Belum melayani Sabah, Sarawak, atau Labuan.',
          })
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['postal_code'],
            message: 'Poskod Malaysia harus 5 digit angka (01000–86999)',
          })
        }
      }
    }
  })

type AddressFormValues = z.infer<typeof addressSchema>

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  addressToEdit?: UserAddress | null
}

const supabase = createBrowserClient()

export function AddressModal({
  isOpen,
  onClose,
  userId,
  addressToEdit,
}: AddressModalProps): React.JSX.Element {
  const isEdit = !!addressToEdit
  const market = useMarketStore((state) => state.market)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country_code: 'ID',
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

  const countryCode = (useWatch({
    control,
    name: 'country_code',
  }) || 'ID') as SupportedCountryCode

  const provinceName = useWatch({
    control,
    name: 'province_name',
  })

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 400)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const { data: searchResultsRes } = useDistrictSearch(debouncedSearchQuery)
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
        const initialCountry = addressToEdit.country_code === 'MY' ? 'MY' : 'ID'
        reset({
          country_code: initialCountry,
          label: addressToEdit.label,
          recipient_name: addressToEdit.recipient_name,
          phone: addressToEdit.phone,
          province_name: addressToEdit.province_name,
          city_name: addressToEdit.city_name,
          district_name: addressToEdit.district_name || '',
          postal_code: addressToEdit.postal_code || '',
          full_address: addressToEdit.full_address,
          zone_id: addressToEdit.zone_id,
          is_default: addressToEdit.is_default,
        })
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearchQuery(
          initialCountry === 'ID' && addressToEdit.district_name
            ? `${addressToEdit.district_name}, ${addressToEdit.city_name}`
            : ''
        )
        setShowSuggestions(false)
        if (addressToEdit.province_name) {
          justInitializedRef.current = true
        }
      } else {
        reset({
          country_code: market === 'MY' ? 'MY' : 'ID',
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

    const fetchZone = async () => {
      try {
        const { data } = await supabase
          .from('shipping_zone_coverage')
          .select('zone_id')
          .eq('country_code', countryCode)
          .ilike('province_name', provinceName.trim())
          .maybeSingle()

        if (data?.zone_id) {
          setValue('zone_id', data.zone_id)
        } else {
          setValue('zone_id', null)
        }
      } catch {
        setValue('zone_id', null)
      }
    }
    fetchZone()
  }, [countryCode, provinceName, setValue])

  const onSubmitForm = async (data: AddressFormValues) => {
    const normalizedPhone = normalizePhoneE164(data.phone, data.country_code)

    const addressData = {
      user_id: userId,
      label: data.label.trim(),
      recipient_name: data.recipient_name.trim(),
      phone: normalizedPhone,
      country_code: data.country_code,
      province_name: data.province_name.trim(),
      city_name: data.city_name.trim(),
      district_name: data.country_code === 'MY' ? null : (data.district_name?.trim() || null),
      postal_code: data.postal_code.trim(),
      full_address: data.full_address.trim(),
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
      setValue('country_code', 'ID')
      setValue('province_name', district.province_name, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue('city_name', district.city_name, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue('district_name', district.district_name, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue('postal_code', district.postal_code || '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue('zone_id', district.zone_id, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
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

  const provinceOptions =
    countryCode === 'MY'
      ? MALAYSIA_WEST_STATES.map((s) => ({ label: s, value: s }))
      : INDONESIA_PROVINCES.map((p) => ({ label: p, value: p }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Ubah Alamat' : 'Tambah Alamat Baru'}>
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 text-sm font-sans">
        {/* Country Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700">
            Negara Tujuan Pengiriman*
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_COUNTRIES.map((c) => {
              const isSelected = countryCode === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    if (countryCode !== c.code) {
                      setValue('country_code', c.code as SupportedCountryCode, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                      setValue('province_name', '')
                      setValue('city_name', '')
                      setValue('district_name', '')
                      setValue('postal_code', '')
                      setValue('zone_id', null)
                      setSearchQuery('')
                    }
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all',
                    isSelected
                      ? 'border-brand-accent bg-brand-accent/5 text-brand-accent shadow-sm'
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
              label={
                countryCode === 'MY'
                  ? 'Nomor Telepon Penerima (Malaysia)*'
                  : 'Nomor Telepon Penerima (Indonesia)*'
              }
              placeholder={
                countryCode === 'MY' ? 'cth: +60123456789 atau 012-3456789' : 'cth: 08123456789'
              }
              helperText={
                countryCode === 'MY'
                  ? 'Gunakan nomor WhatsApp aktif untuk kemudahan konfirmasi pengiriman.'
                  : undefined
              }
              error={errors.phone?.message}
            />
          )}
        />

        {/* Autocomplete district search for Indonesia only */}
        {countryCode === 'ID' && (
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
                setTimeout(() => setShowSuggestions(false), 250)
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
                className="absolute z-50 w-full bg-brand-cream border border-neutral-200/80 shadow-2xl rounded-xl max-h-48 overflow-y-auto mt-1 font-sans text-xs outline-none divide-y divide-neutral-100"
              >
                {searchResults.map((district, index) => (
                  <div
                    key={district.id}
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    aria-selected={focusedIndex === index}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectDistrict(district)
                    }}
                    onClick={() => handleSelectDistrict(district)}
                    onMouseMove={() => setFocusedIndex(index)}
                    className={cn(
                      'p-3 cursor-pointer transition-colors select-none text-left',
                      focusedIndex === index
                        ? 'bg-brand-gold/40 text-brand-plum'
                        : 'hover:bg-brand-gold/30 text-neutral-800'
                    )}
                  >
                    <p className="font-bold text-brand-plum">
                      {district.district_name}, {district.city_name}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                      {district.province_name}{' '}
                      {district.postal_code ? `• ${district.postal_code}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div aria-live="polite" className="sr-only">
              {showSuggestions ? `${searchResults.length} hasil ditemukan.` : ''}
            </div>
          </div>
        )}

        {/* Province / State Dropdown */}
        <Controller
          control={control}
          name="province_name"
          render={({ field }) => (
            <Select
              label={countryCode === 'MY' ? 'Negeri (State - Semenanjung)*' : 'Provinsi*'}
              value={field.value}
              onChange={field.onChange}
              options={provinceOptions}
              placeholder={countryCode === 'MY' ? 'Pilih Negeri' : 'Pilih Provinsi'}
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
                label={countryCode === 'MY' ? 'Bandar / Daerah (City)*' : 'Kota/Kabupaten*'}
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
              label={countryCode === 'MY' ? 'Poskod (5 digit)*' : 'Kode Pos (5 digit)*'}
              placeholder={countryCode === 'MY' ? 'cth: 50450' : 'cth: 12110'}
              helperText={
                countryCode === 'MY'
                  ? 'Pengiriman saat ini mencakup Semenanjung Malaysia (Poskod 01000–86999).'
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
                  ? 'Alamat Lengkap (No. Rumah, Jalan, Kawasan / Taman / Bangunan)*'
                  : 'Alamat Lengkap (Jalan, No. Rumah, RT/RW, Blok, Gg)*'
              }
              placeholder={
                countryCode === 'MY'
                  ? 'cth: No. 15 Jalan SS 2/55, Taman Bahagia...'
                  : 'Tulis alamat detail...'
              }
              helperText={
                countryCode === 'MY'
                  ? 'Kurir ekspor tidak dapat mengirim ke P.O. Box atau Peti Surat.'
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
