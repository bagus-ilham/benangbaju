'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React from 'react'
import { cn } from '@/lib/utils'
import { ProductVariant } from '@/services/products'

interface VariantPickerProps {
  variants: ProductVariant[]
  selectedVariantId: string | null
  onVariantSelect: (variant: ProductVariant | null) => void
}

export function VariantPicker({
  variants,
  selectedVariantId,
  onVariantSelect,
}: VariantPickerProps) {
  // 1. Group attributes from variants
  // Find all unique attributes and values
  // e.g. Warna: ["Hitam", "Milo"], Ukuran: ["S", "M", "L"]
  const attributeGroups: Record<string, string[]> = {}

  variants.forEach((v) => {
    v.product_variant_attrs?.forEach((attr) => {
      const name = attr.attr_name
      const val = attr.attr_value
      if (!attributeGroups[name]) {
        attributeGroups[name] = []
      }
      if (!attributeGroups[name].includes(val)) {
        attributeGroups[name].push(val)
      }
    })
  })

  // 2. Track selected values for each attribute name
  const [selectedValues, setSelectedValues] = React.useState<Record<string, string>>({})

  // Initialize selected values if a selectedVariantId is given
  React.useEffect(() => {
    if (selectedVariantId) {
      const selectedVariant = variants.find((v) => v.id === selectedVariantId)
      if (selectedVariant && selectedVariant.product_variant_attrs) {
        const vals: Record<string, string> = {}
        selectedVariant.product_variant_attrs.forEach((attr) => {
          vals[attr.attr_name] = attr.attr_value
        })
        setSelectedValues(vals)
      }
    }
  }, [selectedVariantId, variants])

  const handleSelect = (attrName: string, value: string) => {
    const updated = { ...selectedValues, [attrName]: value }
    setSelectedValues(updated)

    // Check if the combination matches a valid variant
    const matchedVariant = variants.find((v) => {
      if (!v.product_variant_attrs || v.product_variant_attrs.length === 0) return false
      
      return v.product_variant_attrs.every((attr) => {
        return updated[attr.attr_name] === attr.attr_value
      })
    })

    if (matchedVariant) {
      onVariantSelect(matchedVariant)
    } else {
      onVariantSelect(null)
    }
  }

  // Helper to determine if a variant value is disabled (has no stock anywhere or is invalid combination)
  const isOptionDisabled = (attrName: string, value: string) => {
    // Check if there is AT LEAST one active variant with this attribute value that has stock
    const matchingVariants = variants.filter((v) => {
      return (
        v.is_active &&
        v.product_variant_attrs?.some(
          (attr) => attr.attr_name === attrName && attr.attr_value === value
        )
      )
    })

    const totalStock = matchingVariants.reduce((sum, v) => sum + v.stock, 0)
    return totalStock <= 0
  }

  const attributeKeys = Object.keys(attributeGroups)

  if (attributeKeys.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 py-4 border-t border-b border-neutral-100">
      {attributeKeys.map((name) => (
        <div key={name} className="flex flex-col space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70">
            Pilih {name}
          </span>
          <div className="flex flex-wrap gap-2">
            {attributeGroups[name].map((val) => {
              const isSelected = selectedValues[name] === val
              const disabled = isOptionDisabled(name, val)
              return (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(name, val)}
                  className={cn(
                    // THENBLANK style variant picker buttons: sharp edges, clean text, minimal borders
                    'px-4 py-2 border text-xs font-heading font-medium tracking-wide uppercase transition-all duration-200 disabled:opacity-30 disabled:line-through',
                    isSelected
                      ? 'border-brand-black bg-brand-black text-white'
                      : 'border-neutral-200 text-brand-black hover:border-brand-black hover:bg-neutral-50'
                  )}
                >
                  {val}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
