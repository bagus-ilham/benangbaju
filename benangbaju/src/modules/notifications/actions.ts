'use server'

import { notificationService } from './notification.service'
import { requireAdmin } from '@/lib/auth-guard'

// =============================================================
// USER ACTIONS (Called from hooks that have userId)
// =============================================================

export async function getUserNotificationsAction(userId: string, page = 1, limit = 20) {
  // In a real app we might also verify the user session matches userId
  return notificationService.getUserNotifications(userId, page, limit)
}

export async function markNotificationReadAction(notificationId: string, userId: string) {
  return notificationService.markNotificationRead(notificationId, userId)
}

export async function markAllNotificationsReadAction(userId: string) {
  return notificationService.markAllNotificationsRead(userId)
}

// =============================================================
// ADMIN ACTIONS
// =============================================================

export async function adminGetNotificationTemplatesAction() {
  await requireAdmin()
  return notificationService.adminGetNotificationTemplates()
}

export async function adminCreateNotificationTemplateAction(templateData: {
  name: string
  subject: string
  html_body: string
  is_active: boolean
}) {
  await requireAdmin()
  return notificationService.adminCreateNotificationTemplate(templateData)
}

export async function adminUpdateNotificationTemplateAction(
  templateId: string,
  templateData: Partial<{
    name: string
    subject: string
    html_body: string
    is_active: boolean
  }>
) {
  await requireAdmin()
  return notificationService.adminUpdateNotificationTemplate(templateId, templateData)
}

export async function adminDeleteNotificationTemplateAction(templateId: string) {
  await requireAdmin()
  return notificationService.adminDeleteNotificationTemplate(templateId)
}
