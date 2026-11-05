/**
 * Pixel & Analytics Client Helper
 * Enforces 'IDR' currency across all marketing pixels (Meta, GA4, TikTok)
 * to prevent catalog/checkout IDR numbers from being misinterpreted as MYR (e.g., RM 285,000)
 * when accessed by visitors from Malaysia.
 */

export const LOCKED_COMMERCE_CURRENCY = 'IDR' as const

export interface AnalyticsItem {
  id: string
  name: string
  price: number
  quantity?: number
  category?: string
  variant?: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ttq?: { track: (...args: any[]) => void }
  }
}

/**
 * Tracks product view / detail page visit.
 */
export function trackViewContent(item: AnalyticsItem): void {
  if (typeof window === 'undefined') return

  const payload = {
    content_name: item.name,
    content_ids: [item.id],
    content_type: 'product',
    value: item.price,
    currency: LOCKED_COMMERCE_CURRENCY,
    content_category: item.category,
  }

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', payload)
  }

  // GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'view_item', {
      currency: LOCKED_COMMERCE_CURRENCY,
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          item_category: item.category,
          item_variant: item.variant,
        },
      ],
    })
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function') {
    window.ttq.track('ViewContent', payload)
  }
}

/**
 * Tracks item added to cart.
 */
export function trackAddToCart(item: AnalyticsItem, quantity = 1): void {
  if (typeof window === 'undefined') return

  const subtotal = item.price * quantity
  const payload = {
    content_name: item.name,
    content_ids: [item.id],
    content_type: 'product',
    value: subtotal,
    currency: LOCKED_COMMERCE_CURRENCY,
    num_items: quantity,
  }

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'AddToCart', payload)
  }

  // GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'add_to_cart', {
      currency: LOCKED_COMMERCE_CURRENCY,
      value: subtotal,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity,
          item_category: item.category,
          item_variant: item.variant,
        },
      ],
    })
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function') {
    window.ttq.track('AddToCart', payload)
  }
}

/**
 * Tracks checkout initiation.
 */
export function trackInitiateCheckout(items: AnalyticsItem[], totalAmount: number): void {
  if (typeof window === 'undefined') return

  const contentIds = items.map((i) => i.id)
  const numItems = items.reduce((acc, i) => acc + (i.quantity || 1), 0)

  const payload = {
    content_ids: contentIds,
    content_type: 'product',
    value: totalAmount,
    currency: LOCKED_COMMERCE_CURRENCY,
    num_items: numItems,
  }

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', payload)
  }

  // GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'begin_checkout', {
      currency: LOCKED_COMMERCE_CURRENCY,
      value: totalAmount,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity || 1,
      })),
    })
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function') {
    window.ttq.track('InitiateCheckout', payload)
  }
}

/**
 * Tracks completed purchase.
 */
export function trackPurchase(params: {
  orderNumber: string
  totalAmount: number
  items?: AnalyticsItem[]
}): void {
  if (typeof window === 'undefined') return

  const items = params.items || []
  const payload = {
    content_type: 'product',
    content_ids: items.map((i) => i.id),
    value: params.totalAmount,
    currency: LOCKED_COMMERCE_CURRENCY,
    num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1,
    order_id: params.orderNumber,
  }

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', payload)
  }

  // GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'purchase', {
      transaction_id: params.orderNumber,
      currency: LOCKED_COMMERCE_CURRENCY,
      value: params.totalAmount,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity || 1,
      })),
    })
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function') {
    window.ttq.track('CompletePayment', payload)
  }
}

