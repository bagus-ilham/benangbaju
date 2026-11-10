'use server'

import { requireAdmin, requireAuth } from '@/lib/auth-guard'
import { adminOrderService } from './admin-order.service'
import { orderService } from './order.service'
import { paymentSyncService } from './payment-sync.service'
import type { CreateOrderParams } from '@/modules/orders/types'
import {
  validateAndGetShippingRate,
  calculateCartWeight,
  type CartItemWithWeight,
} from '@/modules/shipping/shipping.utils'
import { fail, type ApiResponse } from '@/lib/api-response'
import { validateMalaysiaStatePostalCodeMatch, hasPoBoxAddress } from '@/lib/utils/validation'
import { getMyPrice, type MyPriceRounding } from '@/lib/utils/pricing'
import { QRIS_MAX_AMOUNT_IDR } from '@/lib/constants'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_SHIPPING: 'INVALID_SHIPPING',
  CHECKOUT_IN_PROGRESS: 'CHECKOUT_IN_PROGRESS',
  EMPTY_CART: 'EMPTY_CART',
  CART_CHANGED: 'CART_CHANGED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  QRIS_LIMIT_EXCEEDED: 'QRIS_LIMIT_EXCEEDED',
} as const

export async function adminUpdateOrderStatusAction(
  orderId: string,
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
  trackingNumber?: string
) {
  await requireAdmin()
  return adminOrderService.updateOrderStatus(orderId, status, trackingNumber)
}

export async function adminUpdateTrackingNumberAction(orderId: string, trackingNumber: string) {
  await requireAdmin()
  return adminOrderService.updateTrackingNumber(orderId, trackingNumber)
}

export async function adminUpdateReturnRequestAction(
  requestId: string,
  params: {
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    adminNotes?: string | null
    refundAmount?: number | null
  }
) {
  await requireAdmin()
  return adminOrderService.updateReturnRequest(requestId, params)
}

export async function adminGetOrdersAction(
  params: { status?: string; search?: string; page?: number; limit?: number; countryCode?: string } = {}
) {
  await requireAdmin()
  return adminOrderService.getOrders(params)
}

export async function adminGetReturnRequestsAction() {
  await requireAdmin()
  return adminOrderService.getReturnRequests()
}

export async function adminGetOrderDetailAction(orderNumber: string) {
  await requireAdmin()
  return adminOrderService.getOrderDetail(orderNumber)
}

export async function adminSyncPaymentStatusAction(orderNumber: string) {
  await requireAdmin()
  return paymentSyncService.syncOrderPayment(orderNumber)
}

export async function getOrdersAction(userId: string, status?: string, page = 1, limit = 10) {
  const { user } = await requireAuth()
  if (user.id !== userId) throw new Error('Unauthorized')
  return orderService.getOrders(userId, status, page, limit)
}

export async function getOrderDetailAction(orderNumber: string, userId?: string) {
  const { user, supabase } = await requireAuth()

  // Check if caller is admin or staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff'
  if (isAdmin) {
    return adminOrderService.getOrderDetail(orderNumber)
  }

  // If userId is provided, verify ownership. Otherwise use the authenticated user's ID.
  const effectiveUserId = userId || user.id
  if (user.id !== effectiveUserId) throw new Error('Unauthorized')
  return orderService.getOrderDetail(orderNumber, effectiveUserId)
}

export async function cancelOrderAction(
  orderId: string,
  reason?: string
): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single()
  if (error || !order || order.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  return orderService.cancelOrder(orderId, reason)
}

export async function confirmDeliveryAction(orderId: string): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single()
  if (error || !order || order.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  return orderService.confirmDelivery(orderId)
}

export async function generatePaymentTokenAction(orderNumber: string) {
  const { user, supabase } = await requireAuth()
  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('order_number', orderNumber)
    .single()
  if (error || !order || order.user_id !== user.id) {
    throw new Error('Unauthorized')
  }
  return orderService.generatePaymentToken(orderNumber)
}

export async function checkPaymentStatusAction(orderNumber: string) {
  const { user, supabase } = await requireAuth()
  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('order_number', orderNumber)
    .single()
  if (error || !order) {
    throw new Error('Pesanan tidak ditemukan')
  }

  // Check if caller is admin or order owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff'
  if (!isAdmin && order.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  return paymentSyncService.syncOrderPayment(orderNumber)
}

export async function lazyCancelExpiredOrdersAction() {
  const { user } = await requireAuth()
  return orderService.lazyCancelExpiredOrders(user.id)
}

export async function createSecureOrderAction(params: CreateOrderParams) {
  const { user, supabase } = await requireAuth()

  if (user.id !== params.userId) {
    return fail(ERROR_CODES.UNAUTHORIZED, 'Unauthorized')
  }

  // Idempotency / Double-Submit Lock (Database-backed)
  // Clean up any stale locks (TTL 5 mins) before trying to acquire a new one
  await supabase.rpc('cleanup_checkout_locks')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: lockError } = await (supabase.from as any)('checkout_locks').insert({
    user_id: user.id,
  })
  if (lockError) {
    return fail(ERROR_CODES.CHECKOUT_IN_PROGRESS, 'Sedang memproses pesanan Anda. Silakan tunggu.')
  }

  try {
    // Verify shipping cost server-side
    // 1 & 2. Get address, cart, payment fee configs, and settings concurrently
    const [addressRes, cartRes, feeConfigsRes, settingsRes] = await Promise.all([
      supabase
        .from('user_addresses')
        .select('id, zone_id, country_code, postal_code, full_address, province_name')
        .eq('id', params.addressId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('carts')
        .select(
          'id, cart_items(variant_id, quantity, product_variants(price, weight_gram, products(weight_gram)))'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)('payment_fee_config').select('*').eq('is_active', true),
      supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'enable_malaysia_shipping',
          'myr_exchange_rate',
          'my_price_markup_percent',
          'my_price_rounding',
        ]),
    ])

    const address = addressRes.data
    const userCart = cartRes.data

    if (!address || !address.zone_id) {
      return fail(ERROR_CODES.INVALID_ADDRESS, 'Invalid address or missing shipping zone')
    }

    const isMalaysia = address.country_code === 'MY'

    // Check Malaysia shipping availability
    if (isMalaysia) {
      const enableMalaysia = settingsRes.data?.find((s) => s.key === 'enable_malaysia_shipping')?.value
      if (enableMalaysia === 'false') {
        return fail(ERROR_CODES.INVALID_SHIPPING, 'Pengiriman ke Malaysia saat ini sedang dinonaktifkan')
      }

      const postalCheck = validateMalaysiaStatePostalCodeMatch(
        address.province_name || '',
        address.postal_code || ''
      )
      if (!postalCheck.valid) {
        return fail(
          ERROR_CODES.INVALID_ADDRESS,
          postalCheck.errorMessage || 'Poskod Malaysia tidak valid untuk negeri yang dipilih'
        )
      }

      if (hasPoBoxAddress(address.full_address || '')) {
        return fail(
          ERROR_CODES.INVALID_ADDRESS,
          'Alamat P.O. Box tidak didukung untuk pengiriman internasional'
        )
      }

      if (params.paymentChannel?.toUpperCase() !== 'QRIS') {
        return fail(
          ERROR_CODES.VALIDATION_ERROR,
          'Pembayaran untuk pengiriman ke Malaysia hanya mendukung QRIS / DuitNow'
        )
      }
    }

    const cartItems = Array.isArray(userCart?.cart_items) ? userCart.cart_items : []

    if (cartItems.length === 0) {
      return fail(ERROR_CODES.EMPTY_CART, 'Keranjang belanja kosong')
    }

    const totalWeight = calculateCartWeight(cartItems as CartItemWithWeight[])

    // 3 & 4. Validate and get shipping rate
    const selectedRate = await validateAndGetShippingRate(address.zone_id, totalWeight, params)

    if (!selectedRate) {
      return fail(ERROR_CODES.INVALID_SHIPPING, 'Invalid shipping method selected')
    }

    // TOCTOU Mitigation: Re-verify cart state right before ordering
    const cartResCheck = await supabase
      .from('carts')
      .select(
        'id, cart_items(variant_id, quantity, product_variants(price, weight_gram, products(weight_gram)))'
      )
      .eq('user_id', user.id)
      .maybeSingle()

    const newCartItems = Array.isArray(cartResCheck.data?.cart_items)
      ? cartResCheck.data.cart_items
      : []
    const newTotalWeight = calculateCartWeight(newCartItems as CartItemWithWeight[])

    // TOCTOU Fix: Verify item identities and quantities match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractSort = (items: any[]) =>
      items
        .map((i) => ({ id: i.variant_id, q: i.quantity }))
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    const originalItemsStr = JSON.stringify(extractSort(cartItems))
    const newItemsStr = JSON.stringify(extractSort(newCartItems))

    if (totalWeight !== newTotalWeight || originalItemsStr !== newItemsStr) {
      return fail(
        ERROR_CODES.CART_CHANGED,
        'Keranjang Anda telah berubah. Silakan ulangi proses checkout.'
      )
    }

    // 5. Server-Side Recalculation of Payment Fee (including active flash sales)
    const nowIso = new Date().toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variantIds = (newCartItems as any[]).map((ci) => ci.variant_id).filter(Boolean)
    interface ActiveFlashItem {
      variant_id: string
      sale_price: number | string | null
      quota: number | null
      sold_count: number | null
      flash_sales?: {
        target_market?: string | null
      } | null
    }
    let activeFlashItems: ActiveFlashItem[] = []
    if (variantIds.length > 0) {
      const { data: fData } = await supabase
        .from('flash_sale_items')
        .select('variant_id, sale_price, quota, sold_count, flash_sales!inner(is_active, starts_at, ends_at, target_market)')
        .in('variant_id', variantIds)
        .eq('flash_sales.is_active', true)
        .lte('flash_sales.starts_at', nowIso)
        .gt('flash_sales.ends_at', nowIso)
      activeFlashItems = (fData || []) as unknown as ActiveFlashItem[]
    }

    const exchangeRate =
      Number(settingsRes.data?.find((s) => s.key === 'myr_exchange_rate')?.value) || 3600
    const markupPercent =
      Number(settingsRes.data?.find((s) => s.key === 'my_price_markup_percent')?.value) || 0
    const rounding = (settingsRes.data?.find((s) => s.key === 'my_price_rounding')?.value ||
      'none') as MyPriceRounding

    const orderCountry = isMalaysia ? 'MY' : 'ID'
    let serverSubtotal = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const ci of newCartItems as any[]) {
      const pv = ci.product_variants
      const flash = activeFlashItems.find(
        (f) =>
          f.variant_id === ci.variant_id &&
          (f.quota === 0 || (f.quota != null && f.sold_count != null && f.sold_count < f.quota)) &&
          (!f.flash_sales?.target_market || f.flash_sales.target_market === 'ALL' || f.flash_sales.target_market === orderCountry)
      )
      let unitPrice = flash?.sale_price != null ? Number(flash.sale_price) : Number(pv?.price) || 0
      if (isMalaysia) {
        unitPrice = getMyPrice(unitPrice, { exchangeRate, markupPercent, rounding }).chargedIdr
      }
      serverSubtotal += unitPrice * (ci.quantity || 1)
    }

    let serverDiscount = 0
    if (params.voucherCode && params.voucherCode.trim()) {
      try {
        const { data: vData } = await supabase.rpc('validate_voucher', {
          p_code: params.voucherCode.trim(),
          p_subtotal: serverSubtotal,
          p_user_id: user.id,
          p_country_code: address.country_code || 'ID',
        })
        const vObj = vData as Record<string, unknown> | null
        if (vObj && typeof vObj === 'object' && vObj.valid) {
          serverDiscount = Number(vObj.discount_amount) || 0
        }
      } catch {
        // Fallback: discount remains 0 if voucher validation fails
      }
    }

    let serverPaymentFee = 0
    if (params.paymentChannel && feeConfigsRes.data) {
      const channelConfig = (feeConfigsRes.data as Array<Record<string, unknown>>).find(
        (c) => String(c.channel_code || '').toUpperCase() === params.paymentChannel?.toUpperCase()
      )
      if (channelConfig) {
        const baseAmount = Math.max(0, serverSubtotal - serverDiscount + selectedRate.price)
        let fee = 0
        if (channelConfig.fee_type === 'flat') {
          fee = Number(channelConfig.fee_flat) || 0
        } else if (channelConfig.fee_type === 'percentage') {
          fee = Math.round(baseAmount * ((Number(channelConfig.fee_percentage) || 0) / 100))
        } else if (channelConfig.fee_type === 'flat_and_percentage') {
          fee =
            (Number(channelConfig.fee_flat) || 0) +
            Math.round(baseAmount * ((Number(channelConfig.fee_percentage) || 0) / 100))
        }
        serverPaymentFee = Math.max(0, fee)
      }
    }

    const calculatedTotalAmount = Math.max(
      0,
      serverSubtotal - serverDiscount + selectedRate.price + serverPaymentFee
    )

    // Check QRIS transaction limit
    if (
      (isMalaysia || params.paymentChannel?.toUpperCase() === 'QRIS') &&
      calculatedTotalAmount > QRIS_MAX_AMOUNT_IDR
    ) {
      return fail(
        ERROR_CODES.QRIS_LIMIT_EXCEEDED,
        'Total transaksi melebihi batas regulasi QRIS Antarnegara (Rp 10.000.000). Silakan bagi menjadi 2 pesanan.'
      )
    }

    // 6. Override the client-provided cost with the server-calculated cost and payment fee
    const secureParams = {
      ...params,
      shippingCost: selectedRate.price,
      paymentFee: serverPaymentFee,
      paymentChannel: params.paymentChannel,
    }

    // Proceed with creating the order
    return await orderService.createOrder(secureParams)
  } finally {
    // Release the lock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)('checkout_locks')
      .delete()
      .eq('user_id', user.id)
  }
}
