import { adminLogRepository } from './admin-log.repository'
import { ApiListResponse } from '@/lib/api-response'
import { ActivityLog } from './types'

export class AdminLogService {
  async adminGetActivityLogs(page = 1, limit = 100): Promise<ApiListResponse<ActivityLog>> {
    return adminLogRepository.adminGetActivityLogs(page, limit)
  }
}

export const adminLogService = new AdminLogService()
