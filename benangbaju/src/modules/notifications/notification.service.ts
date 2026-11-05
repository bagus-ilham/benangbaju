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
      processing: 'Pesanan Diproses',
      shipped: 'Pesanan Dikirim',
      completed: 'Pesanan Selesai',
      cancelled: 'Pesanan Dibatalkan',
    }

    const enTitles: Record<string, string> = {
      processing: 'Order Processing',
      shipped: 'Order Shipped ✈️',
      completed: 'Order Completed',
      cancelled: 'Order Cancelled',
    }

    const idMessages: Record<string, string> = {
      processing: `Pesanan Anda #${orderNumber} sedang diproses oleh penjual.`,
      shipped: trackingNumber
        ? `Pesanan Anda #${orderNumber} telah dikirim dengan resi: ${trackingNumber}.`
        : `Pesanan Anda #${orderNumber} sedang dalam perjalanan.`,
      completed: `Pesanan Anda #${orderNumber} telah selesai. Terima kasih telah berbelanja!`,
      cancelled: `Pesanan Anda #${orderNumber} telah dibatalkan.`,
    }

    const enMessages: Record<string, string> = {
      processing: `Order #${orderNumber} is being prepared and packed for international dispatch.`,
      shipped: trackingNumber
        ? `Order #${orderNumber} has been dispatched with tracking number: ${trackingNumber}.`
        : `Order #${orderNumber} is on its way to Malaysia.`,
      completed: `Order #${orderNumber} has been completed. Thank you for shopping with Benangbaju!`,
      cancelled: `Order #${orderNumber} has been cancelled.`,
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
