import React from 'react'
import { Button, Select, Input, HandDrawnIcon } from '@/shared/components'
import type { ProductLinkPayload } from '@/modules/products/types'

interface ProductMarketplaceLinksProps {
  marketplaceLinks: ProductLinkPayload[]
  onAddLink: () => void
  onRemoveLink: (index: number) => void
  onUpdateLinkField: (index: number, field: keyof ProductLinkPayload, value: string) => void
}

export function ProductMarketplaceLinks({
  marketplaceLinks,
  onAddLink,
  onRemoveLink,
  onUpdateLinkField,
}: ProductMarketplaceLinksProps): React.JSX.Element {
  const handlePlatformChange = (idx: number, platform: string) => {
    onUpdateLinkField(idx, 'platform', platform)
    const current = marketplaceLinks[idx]
    if (!current?.label || current.label.includes('Shopee')) {
      if (platform === 'shopee_my') {
        onUpdateLinkField(idx, 'label', 'Buy on Shopee Malaysia')
      } else if (platform === 'shopee') {
        onUpdateLinkField(idx, 'label', 'Beli di Shopee')
      }
    }
  }

  const handleUrlChange = (idx: number, url: string) => {
    onUpdateLinkField(idx, 'url', url)
    const trimmed = url.toLowerCase().trim()
    if (trimmed.includes('shopee.com.my') || trimmed.includes('my.xiapibuy.com')) {
      onUpdateLinkField(idx, 'platform', 'shopee_my')
      const current = marketplaceLinks[idx]
      if (!current?.label || current.label === 'Beli di Shopee' || !current.label.trim()) {
        onUpdateLinkField(idx, 'label', 'Buy on Shopee Malaysia')
      }
    }
  }

  return (
    <div className="border border-neutral-200 bg-brand-cream p-6 rounded-2xl space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
        <div>
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            Platform Marketplace (E-Commerce)
          </h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Link Shopee Malaysia akan ditampilkan khusus saat pengunjung memilih mode Malaysia (MY).
          </p>
        </div>
        <Button
          type="button"
          onClick={onAddLink}
          variant="outline"
          className="text-[9px] font-bold uppercase py-0.5 px-2 border-neutral-850"
        >
          + Tambah Link
        </Button>
      </div>

      {marketplaceLinks.length === 0 ? (
        <p className="text-[11px] text-neutral-400 italic">Belum ada link marketplace.</p>
      ) : (
        <div className="space-y-4">
          {marketplaceLinks.map((link, idx) => (
            <div
              key={idx}
              className="border border-neutral-200 p-3 relative rounded-xl space-y-2 bg-neutral-50/10"
            >
              <button
                type="button"
                onClick={() => onRemoveLink(idx)}
                className="absolute right-2 top-2 text-neutral-400 hover:text-red-600 p-1"
              >
                <HandDrawnIcon name="trash" className="h-3 w-3" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Select
                    label="Platform"
                    value={link.platform}
                    onChange={(val) => handlePlatformChange(idx, val)}
                    options={[
                      { label: 'Shopee Indonesia', value: 'shopee' },
                      { label: 'Shopee Malaysia (🇲🇾 shopee.com.my)', value: 'shopee_my' },
                      { label: 'TikTok Shop', value: 'tiktok' },
                      { label: 'Tokopedia', value: 'tokopedia' },
                      { label: 'Lazada', value: 'lazada' },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <Input
                    label="Label Tombol"
                    type="text"
                    value={link.label || ''}
                    onChange={(e) => onUpdateLinkField(idx, 'label', e.target.value)}
                    placeholder={link.platform === 'shopee_my' ? 'Buy on Shopee Malaysia' : 'Beli di Shopee'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Input
                  label="URL Link"
                  type="text"
                  value={link.url}
                  onChange={(e) => handleUrlChange(idx, e.target.value)}
                  placeholder={
                    link.platform === 'shopee_my'
                      ? 'https://shopee.com.my/product/...'
                      : 'https://shopee.co.id/...'
                  }
                  required
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
