export const APP_NAME = 'Benangbaju'

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS_BILINGUAL: Record<string, { id: string; en: string }> = {
  pending_payment: { id: 'Menunggu Pembayaran', en: 'Pending Payment' },
  processing: { id: 'Diproses', en: 'Processing' },
  shipped: { id: 'Dikirim', en: 'Shipped' },
  completed: { id: 'Selesai', en: 'Completed' },
  cancelled: { id: 'Dibatalkan', en: 'Cancelled' },
  refunded: { id: 'Di-refund', en: 'Refunded' },
  expired: { id: 'Kedaluwarsa', en: 'Expired' },
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: ORDER_STATUS_LABELS_BILINGUAL.pending_payment.id,
  processing: ORDER_STATUS_LABELS_BILINGUAL.processing.id,
  shipped: ORDER_STATUS_LABELS_BILINGUAL.shipped.id,
  completed: ORDER_STATUS_LABELS_BILINGUAL.completed.id,
  cancelled: ORDER_STATUS_LABELS_BILINGUAL.cancelled.id,
  refunded: ORDER_STATUS_LABELS_BILINGUAL.refunded.id,
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const SHIPPING_STATUS = {
  PENDING: 'pending',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
} as const

export type ShippingStatus = (typeof SHIPPING_STATUS)[keyof typeof SHIPPING_STATUS]

export const VOUCHER_DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const

export type VoucherDiscountType = (typeof VOUCHER_DISCOUNT_TYPE)[keyof typeof VOUCHER_DISCOUNT_TYPE]

export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/benangbaju',
  tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || 'https://tiktok.com/@benangbaju',
  whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || 'https://wa.me/6285179747449',
  shopee: process.env.NEXT_PUBLIC_SOCIAL_SHOPEE || 'https://shopee.co.id/benangbaju',
} as const

export const DEFAULT_WEIGHT_GRAM = 400

export const DEFAULT_MYR_EXCHANGE_RATE = 3600

export const CDN_BASE_URL = 'https://cdn.benangbaju.com'

export const QRIS_MAX_AMOUNT_IDR = 10_000_000

/**
 * Safely parses a MYR exchange rate value with fallback to DEFAULT_MYR_EXCHANGE_RATE.
 */
export function parseMyrExchangeRate(value?: string | number | null): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(num) && num > 0 ? num : DEFAULT_MYR_EXCHANGE_RATE
}

/**
 * Checks whether a Malaysian state/province string refers to East Malaysia (Sabah, Sarawak, Labuan).
 */
export function isEastMalaysiaProvince(province?: string | null): boolean {
  return /sabah|sarawak|labuan/i.test(province || '')
}

export const SUPPORTED_COUNTRIES = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', phonePrefix: '+62' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phonePrefix: '+60' },
] as const

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRIES)[number]['code']

export const INDONESIA_PROVINCES = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
] as const

export const MALAYSIA_WEST_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Selangor',
  'Terengganu',
  'Wilayah Persekutuan Kuala Lumpur',
  'Wilayah Persekutuan Putrajaya',
] as const

export const MALAYSIA_EAST_STATES = [
  'Sabah',
  'Sarawak',
  'Wilayah Persekutuan Labuan',
] as const

export const MALAYSIA_STATES = [
  ...MALAYSIA_WEST_STATES,
  ...MALAYSIA_EAST_STATES,
] as const
