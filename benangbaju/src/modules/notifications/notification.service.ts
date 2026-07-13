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
}

export const notificationService = new NotificationService()
