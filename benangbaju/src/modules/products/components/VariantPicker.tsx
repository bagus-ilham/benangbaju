'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ProductVariant } from '@/modules/products/types'

interface VariantPickerProps {
  variants: ProductVariant[]
  selectedVariantId: string | null
  onVariantSelect: (variant: ProductVariant | null) => void
}

export function VariantPicker({
  variants,
  selectedVariantId,
  onVariantSelect,
}: VariantPickerProps): React.JSX.Element | null {
  // 1. Group attributes from variants
  // Find all unique attributes and values
  // e.g. Warna: ["Hitam", "Milo"], Ukuran: ["S", "M", "L"]
  const attributeGroups = useMemo(() => {
    const groups: Record<string, string[]> = {}

    variants.forEach((v) => {
      v.product_variant_attrs?.forEach((attr) => {
        const name = attr.attr_name
        const val = attr.attr_value
        if (!groups[name]) {
          groups[name] = []
        }
        if (!groups[name].includes(val)) {
          groups[name].push(val)
        }
      })
    })

    return groups
  }, [variants])

  // 2. Track selected values for each attribute name
  // Pre-select any attribute groups that have only one unique value across all variants
  const [selectedValues, setSelectedValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    Object.entries(attributeGroups).forEach(([name, values]) => {
      if (values.length === 1) {
        initial[name] = values[0]
      }
    })
    return initial
  })

  // Safe ref wrapper for parent callback to avoid infinite loops on inline arrow functions
  const onVariantSelectRef = React.useRef(onVariantSelect)
  React.useEffect(() => {
    onVariantSelectRef.current = onVariantSelect
  }, [onVariantSelect])

  // Initialize selected values if a selectedVariantId is given by the parent
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

  // Run matching reactive validation whenever selected values change
  React.useEffect(() => {
    const matchedVariant = variants.find((v) => {
      if (!v.product_variant_attrs || v.product_variant_attrs.length === 0) return false

      return v.product_variant_attrs.every((attr) => {
        return selectedValues[attr.attr_name] === attr.attr_value
      })
    })

    if (matchedVariant) {
      onVariantSelectRef.current(matchedVariant)
    } else {
      onVariantSelectRef.current(null)
    }
  }, [selectedValues, variants])

  const handleSelect = (attrName: string, value: string) => {
    setSelectedValues((prev) => {
      if (prev[attrName] === value) {
        const next = { ...prev }
        delete next[attrName]
        return next
      }
      return { ...prev, [attrName]: value }
    })
  }

  const attributeKeys = useMemo(() => Object.keys(attributeGroups), [attributeGroups])

  // Pre-calculate disabled options map to avoid O(N*M) lookups during render
  const disabledOptionsMap = useMemo(() => {
    const disabledMap: Record<string, Record<string, boolean>> = {}

    attributeKeys.forEach((attrName) => {
      disabledMap[attrName] = {}
      attributeGroups[attrName].forEach((value) => {
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
        disabledMap[attrName][value] = totalStock <= 0
      })
    })

    return disabledMap
  }, [attributeKeys, attributeGroups, variants])

  if (attributeKeys.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 py-4 border-t border-b border-neutral-100">
      {attributeKeys.map((name) => (
        <div key={name} className="flex flex-col space-y-2">
          <span
            id={`label-variant-${name}`}
            className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70"
          >
            Pilih {name}
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-labelledby={`label-variant-${name}`}
          >
            {attributeGroups[name].map((val) => {
              const isSelected = selectedValues[name] === val
              const disabled = disabledOptionsMap[name]?.[val] ?? false
              return (
                <motion.button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={disabled}
                  aria-label={`${val}${disabled ? ' - Habis Terjual' : ''}`}
                  onClick={() => handleSelect(name, val)}
                  whileHover={!disabled ? { y: -1 } : {}}
                  whileTap={!disabled ? { scale: 0.97 } : {}}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    // THENBLANK style variant picker buttons: sharp edges, clean text, minimal borders
                    'relative px-4 py-2 border text-xs font-heading font-medium tracking-wide uppercase transition-colors duration-200 disabled:opacity-30 disabled:line-through focus:outline-none focus-ring-premium',
                    isSelected
                      ? 'border-brand-black bg-brand-black text-white'
                      : 'border-neutral-200 text-brand-black hover:border-brand-black hover:bg-neutral-50'
                  )}
                >
                  {val}
                  {isSelected && (
                    <motion.div
                      layoutId={`active-indicator-${name}`}
                      className="absolute inset-0 border border-brand-black pointer-events-none"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
