import React from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { flashSaleService } from '@/modules/flash-sales/flash-sale.service'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { PageHero, PageContainer, EmptyState } from '@/shared/components'

async function getCachedFlashSale() {
  'use cache'
  cacheLife('minutes')
  cacheTag('flash-sales')

  const supabase = createStaticClient()
  return flashSaleService.getActiveFlashSale(supabase)
}

export default async function FlashSalePage(): Promise<React.JSX.Element> {
  const flashSaleResponse = await getCachedFlashSale()
  const flashSale = flashSaleResponse.data

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow="Penawaran Spesial"
        title="Flash Sale"
        subtitle="Diskon terbatas dengan waktu terbatas. Jangan lewatkan penawaran eksklusif ini."
        variant="dark"
      />

      {flashSale ? (
        <FlashSaleSection flashSale={flashSale} />
      ) : (
        <PageContainer>
          <EmptyState
            icon="Percent"
            title="Tidak Ada Flash Sale Aktif"
            description="Saat ini sedang tidak ada promo flash sale yang berlangsung. Nantikan promo menarik berikutnya dari kami!"
            action={{ label: 'Belanja Produk', href: '/produk' }}
          />
        </PageContainer>
      )}
    </div>
  )
}
