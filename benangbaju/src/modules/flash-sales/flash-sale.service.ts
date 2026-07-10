import { flashSaleRepository } from './flash-sale.repository'
import { FlashSaleDetail, AdminFlashSaleListItem } from './types'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

export class FlashSaleService {
  async getActiveFlashSale(
    client?: SupabaseClient<Database>
  ): Promise<ApiResponse<FlashSaleDetail | null>> {
    return flashSaleRepository.getActiveFlashSale(client)
  }

  async adminGetFlashSales(page = 1, limit = 20): Promise<ApiListResponse<AdminFlashSaleListItem>> {
    return flashSaleRepository.adminGetFlashSales(page, limit)
  }

  async adminCreateFlashSale(
    saleData: {
      name: string
      description: string | null
      banner_url: string | null
      starts_at: string
      ends_at: string
      is_active: boolean
    },
    items: {
      variant_id: string
      original_price: number
      sale_price: number
      quota: number
    }[]
  ): Promise<ApiResponse<{ id: string }>> {
    return flashSaleRepository.adminCreateFlashSale(saleData, items)
  }

  async adminUpdateFlashSale(
    saleId: string,
    saleData: {
      name: string
      description: string | null
      banner_url: string | null
      starts_at: string
      ends_at: string
      is_active: boolean
    },
    items: {
      variant_id: string
      original_price: number
      sale_price: number
      quota: number
    }[]
  ): Promise<ApiResponse<{ id: string }>> {
    return flashSaleRepository.adminUpdateFlashSale(saleId, saleData, items)
  }

  async adminDeleteFlashSale(saleId: string): Promise<ApiResponse<void>> {
    return flashSaleRepository.adminDeleteFlashSale(saleId)
  }
}

export const flashSaleService = new FlashSaleService()
