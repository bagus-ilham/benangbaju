import React from 'react'
import { Input } from '@/components/shared'

interface ProductSeoFieldsProps {
  metaTitle: string
  setMetaTitle: (val: string) => void
  metaDescription: string
  setMetaDescription: (val: string) => void
}

export function ProductSeoFields({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
}: ProductSeoFieldsProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-4">
      <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-100 pb-2.5">
        Meta SEO Tags (Opsional)
      </h3>
      <Input
        label="Meta Title (SEO)"
        value={metaTitle}
        onChange={(e) => setMetaTitle(e.target.value)}
        placeholder="SEO Title produk"
      />
      <div className="space-y-1">
        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Meta Description (SEO)
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="SEO Description untuk mesin pencarian..."
          className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-20 resize-none"
        />
      </div>
    </div>
  )
}
