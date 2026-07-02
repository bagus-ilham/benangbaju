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
  product_reviews?: {
    id: string
    rating: number
    body: string
  } | null
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
  shippingRateId?: string
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

export interface AdminOrderListItem {
  id: string
  order_number: string
  user_id: string
  voucher_id: string | null
  status: string
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
  profiles: {
    name: string
    email: string | null
  } | null
}

export interface AdminReturnRequestListItem {
  id: string
  order_id: string
  user_id: string
  status: string
  reason: string
  customer_notes: string | null
  admin_notes: string | null
  refund_amount: number | null
  refund_bank_name: string | null
  refund_account_number: string | null
  refund_account_name: string | null
  refund_transferred_at: string | null
  approved_at: string | null
  rejected_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  profiles: {
    name: string
    email: string | null
  } | null
  orders: {
    order_number: string
    total_amount: number
  } | null
  return_items: Array<{
    id: string
    return_request_id: string
    order_item_id: string
    quantity: number
    reason: string | null
    order_items: {
      product_name: string
      variant_name: string
      price: number
      sku: string
    } | null
  }>
  return_media: Array<{
    id: string
    url: string
    sort_order: number
  }>
}
