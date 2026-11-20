'use client'

import React from 'react'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { PageHero, PageContainer, EmptyState } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'
import type { FlashSaleDetail } from '@/modules/flash-sales/types'

interface FlashSaleClientProps {
  flashSale: FlashSaleDetail | null
  flashSales?: FlashSaleDetail[]
}

export function FlashSaleClient({
  flashSale,
  flashSales,
}: FlashSaleClientProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const activeFlashSale = React.useMemo(() => {
    if (flashSales && flashSales.length > 0) {
      return (
        flashSales.find(
          (s) => !s.target_market || s.target_market === 'ALL' || s.target_market === market
        ) || null
      )
    }
    if (!flashSale) return null
    if (flashSale.target_market && flashSale.target_market !== 'ALL' && flashSale.target_market !== market) {
      return null
    }
    return flashSale
  }, [flashSale, flashSales, market])

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

      {activeFlashSale ? (
        <FlashSaleSection flashSale={activeFlashSale} flashSales={flashSales} isFullPage={true} />
      ) : (
        <PageContainer className="pt-10 pb-20 md:pb-24">
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

