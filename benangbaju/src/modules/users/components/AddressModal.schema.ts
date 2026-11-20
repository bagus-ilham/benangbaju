import { z } from 'zod'
import { createBrowserClient } from '@/lib/supabase/client'
import type { UserAddress } from '@/modules/shipping/types'
import type { SupportedCountryCode } from '@/lib/constants'
import {
  isValidPhoneByCountry,
  validateMalaysiaStatePostalCodeMatch,
  hasPoBoxAddress,
  validatePostalCode,
} from '@/lib/utils/validation'

export const addressSchema = z
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
      const matchResult = validateMalaysiaStatePostalCodeMatch(
        data.province_name,
        data.postal_code
      )
      if (!matchResult.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['postal_code'],
          message:
            matchResult.errorMessage ||
            'Poskod Malaysia tidak valid untuk negeri yang dipilih.',
        })
      }
    }
  })

export type AddressFormValues = z.infer<typeof addressSchema>

export function createEmptyAddressValues(
  countryCode: SupportedCountryCode = 'ID'
): AddressFormValues {
  return {
    country_code: countryCode,
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
  }
}

export function mapAddressToFormValues(
  address?: UserAddress | null,
  defaultCountry: SupportedCountryCode = 'ID'
): AddressFormValues {
  if (!address) return createEmptyAddressValues(defaultCountry)

  return {
    country_code: address.country_code === 'MY' ? 'MY' : 'ID',
    label: address.label,
    recipient_name: address.recipient_name,
    phone: address.phone,
    province_name: address.province_name,
    city_name: address.city_name,
    district_name: address.district_name || '',
    postal_code: address.postal_code || '',
    full_address: address.full_address,
    zone_id: address.zone_id,
    is_default: address.is_default,
  }
}

const supabase = createBrowserClient()

export async function lookupShippingZoneId(
  countryCode: SupportedCountryCode,
  provinceName: string
): Promise<string | null> {
  const trimmed = provinceName.trim()
  if (!trimmed) return null

  try {
    const { data } = await supabase
      .from('shipping_zone_coverage')
      .select('zone_id')
      .eq('country_code', countryCode)
      .ilike('province_name', trimmed)
      .limit(1)
      .maybeSingle()

    return data?.zone_id ?? null
  } catch {
    return null
  }
}
