'use server'

import { flashSaleService } from './flash-sale.service'
import { requireAdmin } from '@/lib/auth-guard'

export async function adminGetFlashSalesAction(page = 1, limit = 20) {
  await requireAdmin()
  return flashSaleService.adminGetFlashSales(page, limit)
}

export async function adminCreateFlashSaleAction(
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
) {
  await requireAdmin()
  return flashSaleService.adminCreateFlashSale(saleData, items)
}

export async function adminUpdateFlashSaleAction(
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
) {
  await requireAdmin()
  return flashSaleService.adminUpdateFlashSale(saleId, saleData, items)
}

export async function adminDeleteFlashSaleAction(saleId: string) {
  await requireAdmin()
  return flashSaleService.adminDeleteFlashSale(saleId)
}
