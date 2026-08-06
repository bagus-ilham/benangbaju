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
  // 1. Group all attribute names and their unique values
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

  const attributeKeys = useMemo(() => Object.keys(attributeGroups), [attributeGroups])

  // 2. Track selected values for each attribute name
  const [selectedValues, setSelectedValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    const defaultVariant =
      variants.find((v) => v.is_active && v.stock > 0) ||
      variants.find((v) => v.is_active) ||
      variants[0]

    if (defaultVariant && defaultVariant.product_variant_attrs) {
      defaultVariant.product_variant_attrs.forEach((attr) => {
        initial[attr.attr_name] = attr.attr_value
      })
    }
    return initial
  })

  // Safe ref wrapper for parent callback
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

  // 3. Compute options that are valid for the currently selected other attributes
  const visibleOptionsMap = useMemo(() => {
    const visibleMap: Record<string, string[]> = {}

    attributeKeys.forEach((attrName) => {
      const allValues = attributeGroups[attrName] || []
      const filtered = allValues.filter((value) => {
        return variants.some((v) => {
          if (!v.is_active) return false
          const hasThisAttr = v.product_variant_attrs?.some(
            (a) => a.attr_name === attrName && a.attr_value === value
          )
          if (!hasThisAttr) return false

          return Object.entries(selectedValues).every(([otherName, otherVal]) => {
            if (otherName === attrName || !otherVal) return true
            return v.product_variant_attrs?.some(
              (a) => a.attr_name === otherName && a.attr_value === otherVal
            )
          })
        })
      })

      // If filtering produces options, use them. Otherwise fallback to all values for that key
      visibleMap[attrName] = filtered.length > 0 ? filtered : allValues
    })

    return visibleMap
  }, [attributeKeys, attributeGroups, variants, selectedValues])

  // 4. Calculate disabled options map (out of stock)
  const disabledOptionsMap = useMemo(() => {
    const disabledMap: Record<string, Record<string, boolean>> = {}

    attributeKeys.forEach((attrName) => {
      disabledMap[attrName] = {}
      const visibleVals = visibleOptionsMap[attrName] || attributeGroups[attrName] || []

      visibleVals.forEach((value) => {
        const matchingVariants = variants.filter((v) => {
          if (!v.is_active) return false
          const hasThisAttr = v.product_variant_attrs?.some(
            (a) => a.attr_name === attrName && a.attr_value === value
          )
          if (!hasThisAttr) return false

          return Object.entries(selectedValues).every(([otherName, otherVal]) => {
            if (otherName === attrName || !otherVal) return true
            return v.product_variant_attrs?.some(
              (a) => a.attr_name === otherName && a.attr_value === otherVal
            )
          })
        })

        const totalStock = matchingVariants.reduce((sum, v) => sum + v.stock, 0)
        disabledMap[attrName][value] = totalStock <= 0
      })
    })

    return disabledMap
  }, [attributeKeys, attributeGroups, visibleOptionsMap, variants, selectedValues])

  // Run matching reactive validation whenever selected values change
  React.useEffect(() => {
    const matchedVariant = variants.find((v) => {
      if (!v.is_active || !v.product_variant_attrs || v.product_variant_attrs.length === 0) {
        return false
      }

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
      const next = { ...prev, [attrName]: value }

      // Clear any other selected values that become invalid with this new selection
      attributeKeys.forEach((otherName) => {
        if (otherName !== attrName && next[otherName]) {
          const isValidStill = variants.some((v) => {
            if (!v.is_active) return false
            const hasThis = v.product_variant_attrs?.some(
              (a) => a.attr_name === attrName && a.attr_value === value
            )
            const hasOther = v.product_variant_attrs?.some(
              (a) => a.attr_name === otherName && a.attr_value === next[otherName]
            )
            return hasThis && hasOther
          })

          if (!isValidStill) {
            delete next[otherName]
            // Pick first valid option for this other attribute group if available
            const validOthers = (attributeGroups[otherName] || []).filter((val) =>
              variants.some((v) => {
                if (!v.is_active) return false
                const hasThis = v.product_variant_attrs?.some(
                  (a) => a.attr_name === attrName && a.attr_value === value
                )
                const hasOther = v.product_variant_attrs?.some(
                  (a) => a.attr_name === otherName && a.attr_value === val
                )
                return hasThis && hasOther
              })
            )
            if (validOthers.length > 0) {
              next[otherName] = validOthers[0]
            }
          }
        }
      })

      return next
    })
  }

  if (attributeKeys.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 py-4 border-t border-b border-neutral-200/80">
      {attributeKeys.map((name) => {
        const optionsToRender = visibleOptionsMap[name] || attributeGroups[name] || []
        if (optionsToRender.length === 0) return null

        return (
          <div key={name} className="flex flex-col space-y-2.5">
            <div className="flex items-center space-x-2">
              <span
                id={`label-variant-${name}`}
                className="text-[11px] uppercase tracking-wider font-sans font-bold text-brand-plum"
              >
                Pilih {name}
              </span>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby={`label-variant-${name}`}
            >
              {optionsToRender.map((val) => {
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
                      'relative px-4 py-2 border text-xs font-sans font-bold tracking-wide uppercase transition-all duration-200 disabled:opacity-30 disabled:line-through rounded-xl cursor-pointer select-none',
                      isSelected
                        ? 'border-amber-300 bg-brand-gold text-brand-plum shadow-xs font-bold'
                        : 'border-neutral-300 text-brand-plum hover:border-amber-300 hover:bg-brand-gold/30'
                    )}
                  >
                    {val}
                    {isSelected && (
                      <motion.div
                        layoutId={`active-indicator-${name}`}
                        className="absolute inset-0 border border-brand-plum pointer-events-none rounded-xl"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        aria-hidden="true"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

