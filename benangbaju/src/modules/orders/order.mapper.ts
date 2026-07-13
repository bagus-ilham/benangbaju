import type { Database } from '@/shared/types/database'
import { Order, OrderItem, OrderShipping, PaymentInfo } from './types'

export function mapOrder(
  row: Database['public']['Tables']['orders']['Row'] & {
    order_items: Database['public']['Tables']['order_items']['Row'][]
    order_shipping: Database['public']['Tables']['order_shipping']['Row'] | null
    payments?: Database['public']['Tables']['payments']['Row'][]
  }
): Order {
  const order_items: OrderItem[] = row.order_items.map((item: any) => {
    const rawReview = item.product_reviews
    const review = Array.isArray(rawReview) ? rawReview[0] : rawReview ? rawReview : null

    return {
      id: item.id,
      order_id: item.order_id,
      variant_id: item.variant_id || '',
      flash_sale_item_id: item.flash_sale_item_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      product_reviews: review
        ? {
            id: review.id,
            rating: review.rating,
            body: review.body,
          }
        : null,
    }
  })

  const rawShipping = row.order_shipping
  let order_shipping: OrderShipping | null = null
  if (rawShipping) {
    order_shipping = {
      id: rawShipping.id,
      order_id: rawShipping.order_id,
      recipient_name: rawShipping.recipient_name,
      phone: rawShipping.phone,
      full_address: rawShipping.full_address,
      province_name: rawShipping.province_name,
      city_name: rawShipping.city_name,
      district_name: rawShipping.district_name,
      postal_code: rawShipping.postal_code,
      courier_name: rawShipping.courier_name || '',
      tracking_number: rawShipping.tracking_number,
      shipped_at: rawShipping.shipped_at,
      delivered_at: rawShipping.delivered_at,
    }
  }

  const rawPayments = row.payments
  const paymentsList = Array.isArray(rawPayments) ? rawPayments : []
  const payments = paymentsList.map((p: any) => {
    const paymentStatusMap: Record<string, PaymentInfo['status']> = {
      pending: 'pending',
      success: 'success',
      failed: 'failed',
      expired: 'expired',
      refunded: 'refunded',
    }
    return {
      id: p.id,
      order_id: p.order_id,
      midtrans_order_id: p.midtrans_order_id || '',
      status: paymentStatusMap[p.status] || 'pending',
      amount: p.amount,
      payment_type: p.payment_type,
      va_number: p.va_number,
      biller_code: p.biller_code,
      payment_code: p.payment_code,
      qr_url: p.qr_url,
      snap_token: p.snap_token,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }
  })

  const statusMap: Record<string, Order['status']> = {
    pending_payment: 'pending_payment',
    processing: 'processing',
    shipped: 'shipped',
    completed: 'completed',
    cancelled: 'cancelled',
  }

  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    voucher_id: row.voucher_id,
    status: statusMap[row.status] || 'pending_payment',
    subtotal: row.subtotal,
    shipping_cost: row.shipping_cost,
    discount_amount: row.discount_amount,
    total_amount: row.total_amount,
    notes: row.notes,
    cancel_reason: row.cancel_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order_items,
    order_shipping,
    payments,
  }
}
