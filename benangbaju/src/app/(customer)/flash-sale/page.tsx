import React from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { flashSaleService } from '@/modules/flash-sales/flash-sale.service'
import { FlashSaleClient } from './FlashSaleClient'

async function getCachedFlashSales() {
  'use cache'
  cacheLife('minutes')
  cacheTag('flash-sales')

  const supabase = createStaticClient()
  return flashSaleService.getActiveFlashSales(supabase)
}

export default async function FlashSalePage(): Promise<React.JSX.Element> {
  const flashSalesResponse = await getCachedFlashSales()
  const flashSales = flashSalesResponse.data ?? []

  return <FlashSaleClient flashSale={flashSales[0] ?? null} flashSales={flashSales} />
}
