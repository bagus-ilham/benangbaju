import React from 'react'
import { Button, Select, Input } from '@/shared/components'
import { Trash2 } from 'lucide-react'
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
  return (
    <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
        <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
          Platform Marketplace (E-Commerce)
        </h3>
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
              className="border border-neutral-200 p-3 relative rounded-none space-y-2 bg-neutral-50/10"
            >
              <button
                type="button"
                onClick={() => onRemoveLink(idx)}
                className="absolute right-2 top-2 text-neutral-400 hover:text-red-600 p-1"
              >
                <Trash2 size={12} />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Select
                    label="Platform"
                    value={link.platform}
                    onChange={(val) => onUpdateLinkField(idx, 'platform', val)}
                    options={[
                      { label: 'Shopee', value: 'shopee' },
                      { label: 'TikTok Shop', value: 'tiktok' },
                      { label: 'Tokopedia', value: 'tokopedia' },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <Input
                    label="Label Tombol"
                    type="text"
                    value={link.label || ''}
                    onChange={(e) => onUpdateLinkField(idx, 'label', e.target.value)}
                    placeholder="Cek di Shopee"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Input
                  label="URL Link"
                  type="text"
                  value={link.url}
                  onChange={(e) => onUpdateLinkField(idx, 'url', e.target.value)}
                  placeholder="https://shopee.co.id/..."
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
