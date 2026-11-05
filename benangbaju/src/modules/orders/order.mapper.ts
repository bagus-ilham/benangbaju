import { Order, OrderItem, OrderShipping, PaymentInfo } from './types'

export function mapOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any
): Order {
  const rawItems = Array.isArray(row.order_items) ? row.order_items : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order_items: OrderItem[] = rawItems.map((item: any) => {
    const rawReview = item.product_reviews
    const review = Array.isArray(rawReview) ? rawReview[0] : rawReview ? rawReview : null
    const pv = item.product_variants
    const product = Array.isArray(pv?.products) ? pv.products[0] : pv?.products
    const variantWeight = Number(pv?.weight_gram)
    const productWeight = Number(product?.weight_gram)
    const itemWeight = Number(item.weight_gram)
    const weight_gram =
      !isNaN(variantWeight) && variantWeight > 0
        ? variantWeight
        : !isNaN(productWeight) && productWeight > 0
        ? productWeight
        : !isNaN(itemWeight) && itemWeight > 0
        ? itemWeight
        : null
    const hs_code = (product?.hs_code || item.hs_code || '').trim() || null

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
      weight_gram,
      hs_code,
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
  const shippingObj = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping
  let order_shipping: OrderShipping | null = null
  if (shippingObj) {
    order_shipping = {
      id: shippingObj.id,
      order_id: shippingObj.order_id,
      recipient_name: shippingObj.recipient_name,
      phone: shippingObj.phone,
      full_address: shippingObj.full_address,
      province_name: shippingObj.province_name,
      city_name: shippingObj.city_name,
      district_name: shippingObj.district_name,
      postal_code: shippingObj.postal_code,
      courier_name: shippingObj.courier_name || '',
      tracking_number: shippingObj.tracking_number,
      shipped_at: shippingObj.shipped_at,
      delivered_at: shippingObj.delivered_at,
      country_code: shippingObj.country_code || 'ID',
    }
  }

  const rawPayments = row.payments
  const paymentsList = Array.isArray(rawPayments) ? rawPayments : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      gateway_order_id: p.gateway_order_id || p.midtrans_order_id || '',
      status: paymentStatusMap[p.status] || 'pending',
      amount: p.amount,
      payment_fee: Number(p.payment_fee || 0),
      payment_channel: p.payment_channel || null,
      payment_type: p.payment_type,
      va_number: p.va_number,
      biller_code: p.biller_code,
      payment_code: p.payment_code,
      qr_url: p.qr_url,
      snap_token: p.snap_token,
      payment_instructions: p.payment_instructions || null,
      gateway_response: p.gateway_response || null,
      paid_at: p.paid_at || null,
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
    payment_fee: Number(row.payment_fee || 0),
    payment_channel: row.payment_channel || null,
    total_amount: row.total_amount,
    notes: row.notes,
    cancel_reason: row.cancel_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order_items,
    order_shipping,
    payments,
    profiles:
      row.profiles && !Array.isArray(row.profiles)
        ? {
            name: row.profiles.name,
            email: row.profiles.email,
          }
        : null,
  }
}
