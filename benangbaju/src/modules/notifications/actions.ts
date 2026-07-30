'use server'

import { notificationService } from './notification.service'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

// =============================================================
// USER ACTIONS (Protected with requireAuth)
// =============================================================

export async function getUserNotificationsAction(userId?: string, page = 1, limit = 20) {
  const { user } = await requireAuth()
  const targetUserId = userId || user.id
  if (user.id !== targetUserId) throw new Error('Unauthorized')
  return notificationService.getUserNotifications(targetUserId, page, limit)
}

export async function markNotificationReadAction(notificationId: string, userId?: string) {
  const { user } = await requireAuth()
  const targetUserId = userId || user.id
  if (user.id !== targetUserId) throw new Error('Unauthorized')
  return notificationService.markNotificationRead(notificationId, targetUserId)
}

export async function markAllNotificationsReadAction(userId?: string) {
  const { user } = await requireAuth()
  const targetUserId = userId || user.id
  if (user.id !== targetUserId) throw new Error('Unauthorized')
  return notificationService.markAllNotificationsRead(targetUserId)
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
