import { notificationRepository } from './notification.repository'
import type { UserNotification } from './types'
import { NotificationTemplate } from './template.types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export class NotificationService {
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<ApiListResponse<UserNotification>> {
    return notificationRepository.getUserNotifications(userId, page, limit)
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<ApiResponse<void>> {
    return notificationRepository.markNotificationRead(notificationId, userId)
  }

  async markAllNotificationsRead(userId: string): Promise<ApiResponse<void>> {
    return notificationRepository.markAllNotificationsRead(userId)
  }

  async adminGetNotificationTemplates(): Promise<NotificationTemplate[]> {
    return notificationRepository.adminGetNotificationTemplates()
  }

  async adminCreateNotificationTemplate(templateData: {
    name: string
    subject: string
    html_body: string
    is_active: boolean
  }): Promise<NotificationTemplate> {
    return notificationRepository.adminCreateNotificationTemplate(templateData)
  }

  async adminUpdateNotificationTemplate(
    templateId: string,
    templateData: Partial<{
      name: string
      subject: string
      html_body: string
      is_active: boolean
    }>
  ): Promise<NotificationTemplate> {
    return notificationRepository.adminUpdateNotificationTemplate(templateId, templateData)
  }

  async adminDeleteNotificationTemplate(templateId: string): Promise<{ success: boolean }> {
    return notificationRepository.adminDeleteNotificationTemplate(templateId)
  }

  async createNotification(params: {
    userId: string
    type: string
    title: string
    message: string
    data?: Record<string, unknown>
  }): Promise<void> {
    return notificationRepository.createNotification(params)
  }

  async sendOrderStatusNotification(
    userId: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
    countryCode?: string
  ): Promise<void> {
    const isMalaysia = countryCode?.toUpperCase() === 'MY'

    const idTitles: Record<string, string> = {
      pending: 'Menunggu Pembayaran',
      pending_payment: 'Menunggu Pembayaran',
      paid: 'Pembayaran Diterima',
      processing: 'Pesanan Diproses',
      packed: 'Pesanan Telah Dikemas',
      shipped: 'Pesanan Dikirim',
      delivered: 'Pesanan Telah Diterima',
      completed: 'Pesanan Selesai',
      cancelled: 'Pesanan Dibatalkan',
      return_requested: 'Pengajuan Retur Dikirim',
      refunded: 'Dana Dikembalikan',
    }

    const enTitles: Record<string, string> = {
      pending: 'Pending Payment',
      pending_payment: 'Pending Payment',
      paid: 'Payment Received ✅',
      processing: 'Order Processing',
      packed: 'Order Packed & Ready',
      shipped: 'Order Shipped ✈️',
      delivered: 'Order Delivered 🎉',
      completed: 'Order Completed',
      cancelled: 'Order Cancelled',
      return_requested: 'Return Request Received',
      refunded: 'Refund Processed',
    }

    const idMessages: Record<string, string> = {
      pending: `Pesanan Anda #${orderNumber} menunggu pembayaran.`,
      pending_payment: `Pesanan Anda #${orderNumber} menunggu pembayaran.`,
      paid: `Pembayaran pesanan #${orderNumber} telah diverifikasi. Kami akan segera memproses pesanan Anda.`,
      processing: `Pesanan Anda #${orderNumber} sedang diproses oleh penjual.`,
      packed: `Pesanan Anda #${orderNumber} telah selesai dikemas dan siap diserahkan ke kurir.`,
      shipped: trackingNumber
        ? `Pesanan Anda #${orderNumber} telah dikirim dengan resi: ${trackingNumber}.`
        : `Pesanan Anda #${orderNumber} sedang dalam perjalanan.`,
      delivered: `Pesanan Anda #${orderNumber} telah sampai di tujuan. Sila periksa paket Anda.`,
      completed: `Pesanan Anda #${orderNumber} telah selesai. Terima kasih telah berbelanja!`,
      cancelled: `Pesanan Anda #${orderNumber} telah dibatalkan.`,
      return_requested: `Pengajuan retur untuk pesanan #${orderNumber} sedang ditinjau oleh tim kami.`,
      refunded: `Pengembalian dana untuk pesanan #${orderNumber} telah selesai diproses.`,
    }

    const enMessages: Record<string, string> = {
      pending: `Order #${orderNumber} is awaiting payment.`,
      pending_payment: `Order #${orderNumber} is awaiting payment.`,
      paid: `Payment for order #${orderNumber} has been verified. We are preparing your order.`,
      processing: `Order #${orderNumber} is being prepared and packed for international dispatch.`,
      packed: `Order #${orderNumber} is carefully packed and queued for courier pickup.`,
      shipped: trackingNumber
        ? `Order #${orderNumber} has been dispatched with tracking number: ${trackingNumber}.`
        : `Order #${orderNumber} is on its way to Malaysia.`,
      delivered: `Order #${orderNumber} has been delivered. Please check your package.`,
      completed: `Order #${orderNumber} has been completed. Thank you for shopping with Benangbaju!`,
      cancelled: `Order #${orderNumber} has been cancelled.`,
      return_requested: `Your return request for order #${orderNumber} has been received and is being reviewed.`,
      refunded: `Refund for order #${orderNumber} has been processed successfully.`,
    }

    const statusTitles = isMalaysia ? enTitles : idTitles
    const statusMessages = isMalaysia ? enMessages : idMessages

    const title = statusTitles[status] || (isMalaysia ? 'Order Update' : 'Pembaruan Pesanan')
    const message =
      statusMessages[status] ||
      (isMalaysia
        ? `Status for order #${orderNumber} updated to ${status}.`
        : `Status pesanan #${orderNumber} diperbarui menjadi ${status}.`)

    await this.createNotification({
      userId,
      type: 'order_status',
      title,
      message,
      data: {
        order_number: orderNumber,
        status,
        tracking_number: trackingNumber,
        country_code: countryCode || 'ID',
      },
    })
  }
}

export const notificationService = new NotificationService()
