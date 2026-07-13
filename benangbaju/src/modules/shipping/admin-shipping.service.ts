import { safeLogError } from '@/lib/logger'
import { ShippingZone, ShippingRate } from './types'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { shippingRepository } from './shipping.repository'
import { createServerClient } from '@/lib/supabase/server'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'

export class AdminShippingService {
  async getShippingZones(page = 1, limit = 20): Promise<ApiListResponse<ShippingZone>> {
    try {
      const { data, count } = await shippingRepository.adminGetShippingZones(page, limit)

      if (!data) return paginated([], count || 0, page, limit)

      const result = data.map((row) => {
        const rawCoverage = row.shipping_zone_coverage
        const coverageList = Array.isArray(rawCoverage) ? rawCoverage : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shipping_zone_coverage = coverageList.map((c: any) => ({
          province_name: c.province_name,
        }))
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          is_active: row.is_active,
          shipping_zone_coverage,
        }
      })

      return paginated(result, count || 0, page, limit)
    } catch (error) {
      safeLogError('Error fetching admin shipping zones:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar zona pengiriman')
    }
  }

  async createShippingZone(
    zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>,
    provinces: string[]
  ): Promise<ApiResponse<ShippingZone>> {
    try {
      const result = await shippingRepository.adminCreateShippingZone(zone, provinces)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = result as any
      if (res && res.success === false) {
        safeLogError('Error creating shipping zone (RPC transaction):', res.error)
        return fail(ApiErrorCode.INTERNAL_ERROR, res.error?.message || 'Transaction failed')
      }

      const newZone = res?.data
      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'create',
        'shipping_zone',
        newZone.id,
        `Created shipping zone ${newZone.name}`
      )

      return ok(newZone as ShippingZone)
    } catch (error) {
      safeLogError('Error creating shipping zone:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat zona pengiriman')
    }
  }

  async updateShippingZone(
    zoneId: string,
    zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>,
    provinces?: string[]
  ): Promise<ApiResponse<void>> {
    try {
      const result = await shippingRepository.adminUpdateShippingZone(zoneId, zone, provinces)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = result as any
      if (res && res.success === false) {
        safeLogError('Error updating shipping zone (RPC transaction):', res.error)
        return fail(ApiErrorCode.INTERNAL_ERROR, res.error?.message || 'Transaction failed')
      }

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'shipping_zone',
        zoneId,
        `Updated shipping zone ${zone.name || zoneId}`
      )

      return ok()
    } catch (error) {
      safeLogError('Error updating shipping zone:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui zona pengiriman')
    }
  }

  async deleteShippingZone(zoneId: string): Promise<ApiResponse<void>> {
    try {
      await shippingRepository.adminDeleteShippingZone(zoneId)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'delete',
        'shipping_zone',
        zoneId,
        `Deleted shipping zone ${zoneId}`
      )
      return ok()
    } catch (error) {
      safeLogError('Error deleting shipping zone:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus zona pengiriman')
    }
  }

  async getShippingRates(page = 1, limit = 20): Promise<ApiListResponse<ShippingRate>> {
    try {
      const { data, count } = await shippingRepository.adminGetShippingRates(page, limit)

      if (!data) return paginated([], count || 0, page, limit)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = data.map((row: any) => {
        let shipping_zones = null
        if (row.shipping_zones && !Array.isArray(row.shipping_zones)) {
          shipping_zones = { name: row.shipping_zones.name }
        }
        return {
          id: row.id,
          zone_id: row.zone_id,
          courier_name: row.courier_name,
          base_price: row.base_price,
          price_per_kg: row.price_per_kg,
          min_weight_gram: row.min_weight_gram,
          etd_days_min: row.etd_days_min || row.estimated_days_min || 0,
          etd_days_max: row.etd_days_max || row.estimated_days_max || 0,
          is_active: row.is_active,
          shipping_zones,
        }
      })

      return paginated(result, count || 0, page, limit)
    } catch (error) {
      safeLogError('Error fetching admin shipping rates:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar tarif pengiriman')
    }
  }

  async createShippingRate(rate: Omit<ShippingRate, 'id'>): Promise<ApiResponse<ShippingRate>> {
    try {
      const data = await shippingRepository.adminCreateShippingRate(rate)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'create',
        'shipping_rate',
        data.id,
        `Created shipping rate for ${rate.courier_name}`
      )

      return ok(data as unknown as ShippingRate)
    } catch (error) {
      safeLogError('Error creating shipping rate:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat tarif pengiriman')
    }
  }

  async updateShippingRate(
    rateId: string,
    rate: Partial<Omit<ShippingRate, 'id'>>
  ): Promise<ApiResponse<ShippingRate>> {
    try {
      const data = await shippingRepository.adminUpdateShippingRate(rateId, rate)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'shipping_rate',
        rateId,
        `Updated shipping rate ${rateId}`
      )

      return ok(data as unknown as ShippingRate)
    } catch (error) {
      safeLogError('Error updating shipping rate:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui tarif pengiriman')
    }
  }

  async deleteShippingRate(rateId: string): Promise<ApiResponse<void>> {
    try {
      await shippingRepository.adminDeleteShippingRate(rateId)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'delete',
        'shipping_rate',
        rateId,
        `Deleted shipping rate ${rateId}`
      )
      return ok()
    } catch (error) {
      safeLogError('Error deleting shipping rate:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus tarif pengiriman')
    }
  }
}

export const adminShippingService = new AdminShippingService()
