import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  flash_sale_item_id: string | null
  product_name: string
  variant_name: string
  sku: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderShipping {
  id: string
  order_id: string
  recipient_name: string
  phone: string
  full_address: string
  province_name: string
  city_name: string
  district_name: string
  postal_code: string
  courier_name: string
  tracking_number: string | null
  shipped_at: string | null
  delivered_at: string | null
}

export interface PaymentInfo {
  id: string
  order_id: string
  midtrans_order_id: string
  status: 'pending' | 'success' | 'failed' | 'expired' | 'refunded'
  amount: number
  payment_type: string | null
  va_number: string | null
  biller_code: string | null
  payment_code: string | null
  qr_url: string | null
  snap_token: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  voucher_id: string | null
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total_amount: number
  notes: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  order_shipping: OrderShipping | null
  payments?: PaymentInfo[]
}

export interface CreateOrderParams {
  userId: string
  addressId: string
  voucherCode?: string
  courierName?: string
  shippingCost?: number
  notes?: string
}

export interface OrderRpcResponse {
  success: boolean
  message?: string
  code?: string
  data?: {
    order_id: string
    order_number: string
    subtotal: number
    shipping_cost: number
    discount_amount: number
    total_amount: number
    status: string
  }
}

// 1. Get order history
export async function getOrders(
  supabase: SupabaseClient<Database>,
  userId: string,
  status?: string,
  page = 1,
  limit = 10
): Promise<{ orders: Order[]; totalCount: number }> {
  let query = supabase
    .from('orders')
    .select('*, order_items(*), order_shipping(*)', { count: 'exact' })
    .eq('user_id', userId)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Order by newest first
  query = query.order('created_at', { ascending: false })

  // Pagination bounds
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return { orders: [], totalCount: 0 }
  }

  return {
    orders: (data as any) || [],
    totalCount: count || 0,
  }
}

// 2. Get order details by order number
export async function getOrderDetail(
  supabase: SupabaseClient<Database>,
  orderNumber: string
): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_shipping(*), payments(*)')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (error) {
    console.error('Error fetching order detail:', error)
    return null
  }

  return data as any as Order | null
}

// 3. Create order (Atomic Checkout RPC)
export async function createOrder(
  supabase: SupabaseClient<Database>,
  params: CreateOrderParams
): Promise<OrderRpcResponse> {
  const { data, error } = await supabase.rpc('create_order', {
    p_user_id: params.userId,
    p_address_id: params.addressId,
    p_voucher_code: params.voucherCode || undefined,
    p_courier_name: params.courierName || undefined,
    p_shipping_cost: params.shippingCost || 0,
    p_notes: params.notes || undefined,
  })

  if (error) {
    console.error('Error calling create_order:', error)
    return {
      success: false,
      message: 'Gagal membuat pesanan. Silakan coba lagi.',
    }
  }

  return data as unknown as OrderRpcResponse
}

// 4. Cancel unpaid order
export async function cancelOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
  reason = 'Dibatalkan oleh customer'
): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
    p_cancel_reason: reason,
  })

  if (error) {
    console.error('Error calling cancel_order:', error)
    return { success: false, message: error.message }
  }

  const res = data as any
  return {
    success: res.success,
    message: res.message,
  }
}

// 5. Confirm delivery (complete order status)
export async function confirmDelivery(
  supabase: SupabaseClient<Database>,
  orderId: string
): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await supabase.rpc('confirm_delivery', {
    p_order_id: orderId,
  })

  if (error) {
    console.error('Error calling confirm_delivery:', error)
    return { success: false, message: error.message }
  }

  const res = data as any
  return {
    success: res.success,
    message: res.message,
  }
}

// 6. Lazy cancel expired orders
export async function lazyCancelExpiredOrders(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('lazy_cancel_expired_orders', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error calling lazy_cancel_expired_orders:', error)
  }
}

// 7. Request Midtrans snap token from Edge Function
export async function generatePaymentToken(
  supabase: SupabaseClient<Database>,
  orderNumber: string
): Promise<{ success: boolean; token?: string; redirect_url?: string; message?: string }> {
  const { data, error } = await supabase.functions.invoke('generate-payment', {
    body: { order_number: orderNumber },
  })

  if (error) {
    console.error('Error invoking generate-payment function:', error)
    return {
      success: false,
      message: 'Gagal menghubungi server pembayaran. Silakan coba lagi.',
    }
  }

  return data
}

export async function adminGetOrders(
  supabase: SupabaseClient<Database>,
  params: { status?: string; search?: string; page?: number; limit?: number } = {}
) {
  const { status = 'all', search = '', page = 1, limit = 20 } = params
  const offset = (page - 1) * limit

  let query = supabase
    .from('orders')
    .select(
      `
        *,
        order_items (*),
        order_shipping (*),
        profiles (name, email)
      `,
      { count: 'exact' }
    )

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const escapedSearch = search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/,/g, '\\,')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
    query = query.or(`order_number.ilike.%${escapedSearch}%,order_shipping.recipient_name.ilike.%${escapedSearch}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching admin orders:', error)
    throw error
  }

  return {
    orders: (data || []) as any[],
    totalCount: count || 0
  }
}

export async function adminUpdateOrderStatus(
  supabase: SupabaseClient<Database>,
  orderId: string,
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
  trackingNumber?: string
): Promise<{ success: boolean; message?: string }> {
  if (status === 'cancelled') {
    return await cancelOrder(supabase, orderId, 'Dibatalkan oleh Admin')
  }
  if (status === 'completed') {
    return await confirmDelivery(supabase, orderId)
  }

  const { error: orderErr } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (orderErr) throw orderErr

  if (status === 'shipped' && trackingNumber) {
    const { error: shippingErr } = await supabase
      .from('order_shipping')
      .update({
        tracking_number: trackingNumber,
        shipped_at: new Date().toISOString()
      })
      .eq('order_id', orderId)

    if (shippingErr) throw shippingErr
  }

  return { success: true }
}

export async function adminGetReturnRequests(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('return_requests')
    .select(`
      *,
      profiles (name, email),
      orders (order_number, total_amount),
      return_items (*, order_items (*))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin return requests:', error)
    throw error
  }

  return data || []
}

export async function adminUpdateReturnRequest(
  supabase: SupabaseClient<Database>,
  requestId: string,
  params: {
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    adminNotes?: string | null
    refundAmount?: number | null
  }
): Promise<{ success: boolean }> {
  const { status, adminNotes, refundAmount } = params
  const now = new Date().toISOString()
  
  const updateData: any = {
    status,
    admin_notes: adminNotes,
    refund_amount: refundAmount,
    updated_at: now
  }

  if (status === 'approved') {
    updateData.approved_at = now
  } else if (status === 'rejected') {
    updateData.rejected_at = now
  } else if (status === 'completed') {
    updateData.completed_at = now
    updateData.refund_transferred_at = now
  }

  const { error } = await supabase
    .from('return_requests')
    .update(updateData)
    .eq('id', requestId)

  if (error) {
    console.error('Error updating return request:', error)
    throw error
  }

  return { success: true }
}
