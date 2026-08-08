'use server'

import { settingsService } from './settings.service'
import { requireAdmin } from '@/lib/auth-guard'
import type { SiteSetting } from './types'

export async function adminGetSettingsAction() {
  await requireAdmin()
  return settingsService.adminGetSettings()
}

export async function adminUpdateSettingsAction(settings: Record<string, string>) {
  await requireAdmin()
  return settingsService.adminUpdateSettings(settings)
}

export async function adminUpsertSettingsAction(settings: SiteSetting[]) {
  await requireAdmin()
  return settingsService.adminUpsertSettings(settings)
}

export async function getSiteSettingsAction() {
  return settingsService.getSiteSettings()
}

export async function getPaymentFeeConfigsAction() {
  return settingsService.getPaymentFeeConfigs()
}

export async function adminUpdatePaymentFeeConfigAction(
  id: string,
  updates: Partial<import('@/modules/orders/types').PaymentFeeConfig>
) {
  await requireAdmin()
  return settingsService.adminUpdatePaymentFeeConfig(id, updates)
}
