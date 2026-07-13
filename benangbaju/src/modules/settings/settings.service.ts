import { settingsRepository } from './settings.repository'
import type { SiteSetting } from './types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

export class SettingsService {
  async adminGetSettings(): Promise<ApiListResponse<SiteSetting>> {
    return settingsRepository.adminGetSettings()
  }

  async adminUpdateSettings(settings: Record<string, string>): Promise<ApiResponse<void>> {
    return settingsRepository.adminUpdateSettings(settings)
  }

  async adminUpsertSettings(settings: SiteSetting[]): Promise<ApiResponse<void>> {
    return settingsRepository.adminUpsertSettings(settings)
  }

  async getSiteSettings(client?: SupabaseClient<Database>): Promise<ApiListResponse<SiteSetting>> {
    return settingsRepository.getSiteSettings(client)
  }
}

export const settingsService = new SettingsService()
