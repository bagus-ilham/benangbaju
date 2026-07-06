import React from 'react'
import { Input, Textarea } from '@/shared/components'

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
        <Textarea
          label="Meta Description (SEO)"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="SEO Description untuk mesin pencarian..."
          rows={3}
        />
      </div>
    </div>
  )
}
