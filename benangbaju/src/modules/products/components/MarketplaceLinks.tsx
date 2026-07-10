'use client'

import React from 'react'
import { ShoppingBag } from 'lucide-react'
import { ProductMarketplaceLink } from '@/modules/products/types'

interface MarketplaceLinksProps {
  links: ProductMarketplaceLink[]
}

export function MarketplaceLinks({ links }: MarketplaceLinksProps): React.JSX.Element | null {
  if (links.length === 0) return null

  // Helper to resolve platform names nicely
  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shopee':
        return 'Beli di Shopee'
      case 'tokopedia':
        return 'Beli di Tokopedia'
      case 'tiktok':
        return 'Beli di TikTok Shop'
      case 'lazada':
        return 'Beli di Lazada'
      default:
        return 'Beli di Marketplace'
    }
  }

  return (
    <div className="space-y-3 py-4">
      <span className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-400 block">
        Tersedia juga di Marketplace
      </span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 px-4 py-3 border border-neutral-200 hover:border-brand-black bg-white text-xs font-heading font-medium tracking-wide uppercase transition-colors duration-200 text-brand-black"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>{link.label || getPlatformLabel(link.platform)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
