'use server'

import { adminLogService } from './admin-log.service'
import { requireAdmin } from '@/lib/auth-guard'

export async function getAdminActivityLogsAction(page = 1, limit = 100) {
  await requireAdmin()
  return adminLogService.adminGetActivityLogs(page, limit)
}
