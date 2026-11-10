'use client'

import React from 'react'
import { HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { ProductMarketplaceLink } from '@/modules/products/types'
import { useMarket } from '@/shared/stores/marketStore'

interface MarketplaceLinksProps {
  links: ProductMarketplaceLink[]
}

export function MarketplaceLinks({ links }: MarketplaceLinksProps): React.JSX.Element | null {
  const market = useMarket()
  const isMY = market === 'MY'

  if (!links || links.length === 0) return null

  // Filter links strictly based on market mode:
  // - Mode MY: show only Shopee Malaysia / shopee.com.my links
  // - Mode ID: show domestic Indonesian platforms (Shopee ID, Tokopedia, TikTok Shop, etc.)
  const filteredLinks = links.filter((link) => {
    const isMalaysiaLink =
      link.platform.toLowerCase() === 'shopee_my' ||
      link.url.toLowerCase().includes('shopee.com.my') ||
      link.url.toLowerCase().includes('my.xiapibuy.com')

    return isMY ? isMalaysiaLink : !isMalaysiaLink
  })

  if (filteredLinks.length === 0) return null

  // Helper to resolve platform names nicely
  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shopee_my':
        return 'Buy on Shopee Malaysia'
      case 'shopee':
        return isMY ? 'Buy on Shopee' : 'Beli di Shopee'
      case 'tokopedia':
        return 'Beli di Tokopedia'
      case 'tiktok':
        return isMY ? 'Buy on TikTok Shop' : 'Beli di TikTok Shop'
      case 'lazada':
        return isMY ? 'Buy on Lazada' : 'Beli di Lazada'
      default:
        return isMY ? 'Buy on Marketplace' : 'Beli di Marketplace'
    }
  }

  const resolveLinkLabel = (link: ProductMarketplaceLink) => {
    const rawLabel = link.label?.trim()
    if (isMY && (!rawLabel || rawLabel === 'Beli di Shopee' || rawLabel === 'Cek di Shopee')) {
      return 'Buy on Shopee Malaysia'
    }
    return rawLabel || getPlatformLabel(link.platform)
  }

  const getPlatformIconName = (platform: string): HandDrawnIconName => {
    const p = platform.toLowerCase()
    if (p.includes('shopee')) return 'shopee'
    if (p.includes('tiktok')) return 'tiktok'
    return 'shopping-bag'
  }

  return (
    <div className="space-y-3 py-4">
      <span className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-600 block">
        {isMY ? 'Also Available on Marketplace' : 'Tersedia juga di Marketplace'}
      </span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filteredLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 px-4 py-3 border border-neutral-200 hover:border-brand-plum bg-brand-cream text-xs font-heading font-medium tracking-wide uppercase transition-all duration-200 text-brand-plum rounded-xl hover:-translate-y-0.5 hover:shadow-sm"
          >
            <HandDrawnIcon name={getPlatformIconName(link.platform)} className="h-4 w-4" />
            <span>{resolveLinkLabel(link)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
