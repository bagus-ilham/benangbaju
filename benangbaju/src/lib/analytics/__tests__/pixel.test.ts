import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  LOCKED_COMMERCE_CURRENCY,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
} from '../pixel'

describe('Analytics Pixel Currency Lock', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).window = {
      fbq: vi.fn(),
      gtag: vi.fn(),
      ttq: { track: vi.fn() },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('guarantees LOCKED_COMMERCE_CURRENCY is always IDR', () => {
    expect(LOCKED_COMMERCE_CURRENCY).toBe('IDR')
  })

  it('trackViewContent dispatches with locked IDR currency', () => {
    trackViewContent({
      id: 'prod-123',
      name: 'Batik Dress',
      price: 285000,
      category: 'Dress',
    })

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'ViewContent',
      expect.objectContaining({
        content_name: 'Batik Dress',
        value: 285000,
        currency: 'IDR',
      })
    )

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'view_item',
      expect.objectContaining({
        currency: 'IDR',
        value: 285000,
      })
    )

    expect(window.ttq?.track).toHaveBeenCalledWith(
      'ViewContent',
      expect.objectContaining({
        currency: 'IDR',
        value: 285000,
      })
    )
  })

  it('trackAddToCart dispatches with locked IDR currency and calculated subtotal', () => {
    trackAddToCart(
      {
        id: 'prod-123',
        name: 'Batik Dress',
        price: 285000,
      },
      2
    )

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'AddToCart',
      expect.objectContaining({
        value: 570000,
        currency: 'IDR',
        num_items: 2,
      })
    )

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'add_to_cart',
      expect.objectContaining({
        currency: 'IDR',
        value: 570000,
      })
    )
  })

  it('trackInitiateCheckout dispatches with locked IDR currency', () => {
    trackInitiateCheckout(
      [
        { id: '1', name: 'Item 1', price: 100000, quantity: 1 },
        { id: '2', name: 'Item 2', price: 200000, quantity: 2 },
      ],
      500000
    )

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'InitiateCheckout',
      expect.objectContaining({
        value: 500000,
        currency: 'IDR',
        num_items: 3,
      })
    )
  })

  it('trackPurchase dispatches with locked IDR currency and order number', () => {
    trackPurchase({
      orderNumber: 'BB-20261105-001',
      totalAmount: 520000,
      items: [{ id: '1', name: 'Item 1', price: 520000, quantity: 1 }],
    })

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({
        order_id: 'BB-20261105-001',
        value: 520000,
        currency: 'IDR',
      })
    )

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({
        transaction_id: 'BB-20261105-001',
        currency: 'IDR',
        value: 520000,
      })
    )
  })
})

