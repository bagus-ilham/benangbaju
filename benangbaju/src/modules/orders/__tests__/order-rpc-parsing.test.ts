import { describe, it, expect, vi } from 'vitest'
import { orderService } from '../order.service'
import { orderRepository } from '../order.repository'

// Mock orderRepository
vi.mock('../order.repository', () => ({
  orderRepository: {
    create: vi.fn(),
  },
}))

describe('Order Service - createOrder parsing', () => {
  const dummyParams = {
    userId: 'user-1',
    addressId: 'addr-1',
    shippingCost: 10000,
    courierName: 'JNE',
  }

  it('handles error from repository correctly', async () => {
    vi.mocked(orderRepository.create).mockRejectedValueOnce(
      new Error('Gagal membuat pesanan. Silakan coba lagi.')
    )

    const res = await orderService.createOrder(dummyParams)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.message).toBe('Gagal membuat pesanan. Silakan coba lagi.')
    }
  })

  it('parses correctly formatted inner data', async () => {
    vi.mocked(orderRepository.create).mockResolvedValueOnce({
      order_id: 'ord-123',
      order_number: 'ORD-123',
      subtotal: 100000,
      shipping_cost: 10000,
      discount_amount: 0,
      total_amount: 110000,
      status: 'pending_payment',
    })

    const res = await orderService.createOrder(dummyParams)

    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toEqual({
        order_id: 'ord-123',
        order_number: 'ORD-123',
        subtotal: 100000,
        shipping_cost: 10000,
        discount_amount: 0,
        total_amount: 110000,
        status: 'pending_payment',
      })
    }
  })

  it('gracefully handles wrong types in inner data (type safety net)', async () => {
    vi.mocked(orderRepository.create).mockResolvedValueOnce({
      order_id: null, // should default to ''
      subtotal: '100000', // string instead of number, should default to 0
      total_amount: undefined,
    })

    const res = await orderService.createOrder(dummyParams)

    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toEqual({
        order_id: '',
        order_number: '',
        subtotal: 100000,
        shipping_cost: 0,
        discount_amount: 0,
        total_amount: 0,
        status: '',
      })
    }
  })
})
