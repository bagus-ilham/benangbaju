import { isObject } from '@/lib/utils/validation'
import { safeLogError } from '@/lib/logger'
import { UserAddress, District, ShippingOption } from './types'
import { ApiResponse, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { shippingRepository } from './shipping.repository'

export class ShippingService {
  async getUserAddresses(userId: string): Promise<ApiResponse<UserAddress[]>> {
    try {
      const data = await shippingRepository.getUserAddresses(userId)
      if (!data) return ok([])

      return ok(
        data.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          label: row.label,
          recipient_name: row.recipient_name,
          phone: row.phone,
          province_name: row.province_name,
          city_name: row.city_name,
          district_name: row.district_name,
          postal_code: row.postal_code,
          full_address: row.full_address,
          zone_id: row.zone_id,
          is_default: row.is_default,
          created_at: row.created_at,
        }))
      )
    } catch (error) {
      safeLogError('Error fetching user addresses:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil alamat pengguna')
    }
  }

  async addUserAddress(
    address: Omit<UserAddress, 'id' | 'created_at'>
  ): Promise<ApiResponse<UserAddress>> {
    try {
      const data = await shippingRepository.addUserAddress(address)
      return ok({
        id: data.id,
        user_id: data.user_id,
        label: data.label,
        recipient_name: data.recipient_name,
        phone: data.phone,
        province_name: data.province_name,
        city_name: data.city_name,
        district_name: data.district_name,
        postal_code: data.postal_code,
        full_address: data.full_address,
        zone_id: data.zone_id,
        is_default: data.is_default,
        created_at: data.created_at,
      })
    } catch (error) {
      safeLogError('Error adding user address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menambahkan alamat.')
    }
  }

  async updateUserAddress(
    addressId: string,
    userId: string,
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  ): Promise<ApiResponse<UserAddress>> {
    try {
      const data = await shippingRepository.updateUserAddress(addressId, userId, address)
      return ok({
        id: data.id,
        user_id: data.user_id,
        label: data.label,
        recipient_name: data.recipient_name,
        phone: data.phone,
        province_name: data.province_name,
        city_name: data.city_name,
        district_name: data.district_name,
        postal_code: data.postal_code,
        full_address: data.full_address,
        zone_id: data.zone_id,
        is_default: data.is_default,
        created_at: data.created_at,
      })
    } catch (error) {
      safeLogError('Error updating user address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui alamat.')
    }
  }

  async deleteUserAddress(addressId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await shippingRepository.deleteUserAddress(addressId, userId)
      return ok()
    } catch (error) {
      safeLogError('Error deleting user address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus alamat.')
    }
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await shippingRepository.setDefaultAddress(addressId, userId)
      return ok()
    } catch (error) {
      safeLogError('Error setting default address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengatur alamat utama.')
    }
  }

  async searchDistricts(searchQuery: string): Promise<ApiResponse<District[]>> {
    if (!searchQuery || searchQuery.trim().length < 2) return ok([])

    try {
      const data = await shippingRepository.searchDistricts(searchQuery)
      if (!data) return ok([])

      return ok(
        data.map((row) => ({
          id: row.id,
          province_name: row.province_name,
          city_name: row.city_name,
          district_name: row.district_name,
          postal_code: row.postal_code,
          zone_id: row.zone_id,
        }))
      )
    } catch (error) {
      safeLogError('Error searching districts:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mencari kecamatan')
    }
  }

  async calculateShippingRates(
    zoneId: string,
    weightGram: number
  ): Promise<ApiResponse<ShippingOption[]>> {
    try {
      const data = await shippingRepository.calculateShippingRates(zoneId, weightGram)

      if (data && isObject(data)) {
        const success = typeof data['success'] === 'boolean' ? data['success'] : false
        const message = typeof data['message'] === 'string' ? data['message'] : undefined
        const rawOptions = data['data']

        if (!success) {
          return fail(ApiErrorCode.VALIDATION_ERROR, message || 'Gagal menghitung ongkos kirim')
        }

        const optionsList = Array.isArray(rawOptions) ? rawOptions : []
        const options: ShippingOption[] = []

        for (const opt of optionsList) {
          if (opt && isObject(opt)) {
            options.push({
              id: typeof opt['id'] === 'string' ? opt['id'] : '',
              courier_name: typeof opt['courier_name'] === 'string' ? opt['courier_name'] : '',
              price: typeof opt['price'] === 'number' ? opt['price'] : 0,
              etd_min: typeof opt['etd_min'] === 'number' ? opt['etd_min'] : 0,
              etd_max: typeof opt['etd_max'] === 'number' ? opt['etd_max'] : 0,
              weight_used_gram:
                typeof opt['weight_used_gram'] === 'number' ? opt['weight_used_gram'] : 0,
            })
          }
        }

        return ok(options)
      }

      return fail(ApiErrorCode.INTERNAL_ERROR, 'Respon dari sistem pengiriman tidak valid.')
    } catch (error) {
      safeLogError('Error calculating shipping:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghitung ongkos kirim. Silakan coba lagi.')
    }
  }
}

export const shippingService = new ShippingService()
