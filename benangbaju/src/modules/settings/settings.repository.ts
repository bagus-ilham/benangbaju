import type { SiteSetting } from './types'
import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { createServerClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSiteSetting(row: any): SiteSetting {
  const typeMap: Record<string, SiteSetting['type']> = {
    text: 'text',
    json: 'json',
    boolean: 'boolean',
    image: 'image',
    number: 'number',
  }
  const groupMap: Record<string, SiteSetting['group']> = {
    general: 'general',
    seo: 'seo',
    payment: 'payment',
    social: 'social',
  }
  return {
    key: row.key,
    value: row.value,
    type: typeMap[row.type] || 'text',
    group: groupMap[row.group] || 'general',
    label: row.label,
  }
}

export class SettingsRepository {
  async adminGetSettings(): Promise<ApiListResponse<SiteSetting>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, type, group, label')

    if (error) {
      safeLogError('Error fetching site settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil pengaturan')
    }

    const list = data ? data.map(mapSiteSetting) : []
    return paginated(list)
  }

  async adminUpdateSettings(settings: Record<string, string>): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    // Fetch existing settings to preserve all required fields
    const res = await this.adminGetSettings()
    if (!res.success) return fail(ApiErrorCode.INTERNAL_ERROR, res.error.message)
    const currentSettings = res.data || []

    const currentMap = new Map(currentSettings.map((s) => [s.key, s]))
    const settingsToUpsert = Object.entries(settings).map(([key, value]) => {
      const existing = currentMap.get(key)
      return {
        key,
        value,
        type: existing?.type || 'string',
        group: existing?.group || 'general',
        label: existing?.label || key,
      }
    })

    if (settingsToUpsert.length === 0) return ok()

    const { error } = await supabase
      .from('site_settings')
      .upsert(settingsToUpsert, { onConflict: 'key' })

    if (error) {
      safeLogError('Error updating site settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui pengaturan')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'settings',
      'bulk',
      'Updated site settings'
    )
    return ok()
  }

  async adminUpsertSettings(settings: SiteSetting[]): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'key' })

    if (error) {
      safeLogError('Error upserting settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal upsert pengaturan')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'settings',
      'bulk',
      'Upserted site settings'
    )
    return ok()
  }

  async getSiteSettings(client?: SupabaseClient<Database>): Promise<ApiListResponse<SiteSetting>> {
    const supabase = client || createStaticClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, type, group, label')

    if (error) {
      safeLogError('Error fetching site settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil pengaturan')
    }

    const list = data ? data.map(mapSiteSetting) : []
    return paginated(list)
  }

  async getPaymentFeeConfigs(): Promise<ApiListResponse<import('@/modules/orders/types').PaymentFeeConfig>> {
    const supabase = await createServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('payment_fee_config')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      safeLogError('Error fetching payment fee configs:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil konfigurasi biaya pembayaran')
    }

    return paginated((data || []) as import('@/modules/orders/types').PaymentFeeConfig[])
  }

  async adminUpdatePaymentFeeConfig(
    id: string,
    updates: Partial<import('@/modules/orders/types').PaymentFeeConfig>
  ): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.fee_type !== undefined) updatePayload.fee_type = updates.fee_type
    if (updates.fee_flat !== undefined) updatePayload.fee_flat = updates.fee_flat
    if (updates.fee_percentage !== undefined) updatePayload.fee_percentage = updates.fee_percentage
    if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('payment_fee_config')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      safeLogError('Error updating payment fee config:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui konfigurasi biaya pembayaran')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'payment_fee_config',
      id,
      `Updated fee config for ${updates.channel_code || id}`
    )

    return ok()
  }
}

export const settingsRepository = new SettingsRepository()
