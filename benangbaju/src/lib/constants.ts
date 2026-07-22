export const APP_NAME = 'Benangbaju'

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Menunggu Pembayaran',
  paid: 'Sudah Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  refunded: 'Di-refund',
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

export const DEFAULT_WEIGHT_GRAM = 1000
