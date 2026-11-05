import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from '../notification.service'
import { notificationRepository } from '../notification.repository'

vi.mock('../notification.repository', () => ({
  notificationRepository: {
    createNotification: vi.fn(),
  },
}))

describe('NotificationService Bilingual Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends Indonesian notification for domestic ID order by default', async () => {
    await notificationService.sendOrderStatusNotification(
      'user-1',
      'BB-001',
      'processing'
    )

    expect(notificationRepository.createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'order_status',
      title: 'Pesanan Diproses',
      message: 'Pesanan Anda #BB-001 sedang diproses oleh penjual.',
      data: {
        order_number: 'BB-001',
        status: 'processing',
        tracking_number: undefined,
        country_code: 'ID',
      },
    })
  })

  it('sends English notification for Malaysia (MY) processing order', async () => {
    await notificationService.sendOrderStatusNotification(
      'user-1',
      'BB-MY-001',
      'processing',
      undefined,
      'MY'
    )

    expect(notificationRepository.createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'order_status',
      title: 'Order Processing',
      message: 'Order #BB-MY-001 is being prepared and packed for international dispatch.',
      data: {
        order_number: 'BB-MY-001',
        status: 'processing',
        tracking_number: undefined,
        country_code: 'MY',
      },
    })
  })

  it('sends English notification with tracking AWB for Malaysia (MY) shipped order', async () => {
    await notificationService.sendOrderStatusNotification(
      'user-1',
      'BB-MY-001',
      'shipped',
      'NINJA-MY-12345',
      'MY'
    )

    expect(notificationRepository.createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'order_status',
      title: 'Order Shipped ✈️',
      message:
        'Order #BB-MY-001 has been dispatched with tracking number: NINJA-MY-12345.',
      data: {
        order_number: 'BB-MY-001',
        status: 'shipped',
        tracking_number: 'NINJA-MY-12345',
        country_code: 'MY',
      },
    })
  })

  it('sends English notification for Malaysia (MY) cancelled order', async () => {
    await notificationService.sendOrderStatusNotification(
      'user-1',
      'BB-MY-001',
      'cancelled',
      undefined,
      'MY'
    )

    expect(notificationRepository.createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'order_status',
      title: 'Order Cancelled',
      message: 'Order #BB-MY-001 has been cancelled.',
      data: {
        order_number: 'BB-MY-001',
        status: 'cancelled',
        tracking_number: undefined,
        country_code: 'MY',
      },
    })
  })
})

