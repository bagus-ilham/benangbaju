'use client'

import React from 'react'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { PageHero, PageContainer, EmptyState } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'
import type { FlashSaleDetail } from '@/modules/flash-sales/types'

interface FlashSaleClientProps {
  flashSale: FlashSaleDetail | null
}

export function FlashSaleClient({ flashSale }: FlashSaleClientProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <div className="bg-brand-cream min-h-screen">
      <PageHero
        eyebrow={isMY ? 'Special Offers' : 'Penawaran Spesial'}
        title="Flash Sale"
        subtitle={
          isMY
            ? 'Limited-time discounts. Do not miss these exclusive curated deals.'
            : 'Diskon terbatas dengan waktu terbatas. Jangan lewatkan penawaran eksklusif ini.'
        }
        variant="dark"
      />

      {flashSale ? (
        <FlashSaleSection flashSale={flashSale} isFullPage={true} />
      ) : (
        <PageContainer>
          <EmptyState
            handDrawnIcon="sparkles"
            title={isMY ? 'No Active Flash Sale' : 'Tidak Ada Flash Sale Aktif'}
            description={
              isMY
                ? 'There are currently no active flash sales. Stay tuned for our upcoming exclusive deals!'
                : 'Saat ini sedang tidak ada promo flash sale yang berlangsung. Nantikan promo menarik berikutnya dari kami!'
            }
            action={{ label: isMY ? 'Shop Collection' : 'Belanja Produk', href: '/produk' }}
          />
        </PageContainer>
      )}
    </div>
  )
}
