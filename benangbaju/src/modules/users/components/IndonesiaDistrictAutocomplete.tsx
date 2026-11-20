'use client'

import React, { useState, useEffect, useRef, useId } from 'react'
import { Input } from '@/shared/components'
import { useDistrictSearch } from '@/modules/shipping/hooks/useShipping'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { District } from '@/modules/shipping/types'
import { cn } from '@/lib/utils'

interface IndonesiaDistrictAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelectDistrict: (district: District) => void
}

export function IndonesiaDistrictAutocomplete({
  value,
  onChange,
  onSelectDistrict,
}: IndonesiaDistrictAutocompleteProps): React.JSX.Element {
  const debouncedQuery = useDebounce(value, 400)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const { data: searchResultsRes } = useDistrictSearch(debouncedQuery)
  const searchResults = searchResultsRes?.data || []

  const listboxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const handleSelect = (district: District) => {
    onSelectDistrict(district)
    setShowSuggestions(false)
    setFocusedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleSelect(searchResults[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setFocusedIndex(-1)
        break
    }
  }

  useEffect(() => {
    if (showSuggestions && focusedIndex >= 0 && listboxRef.current) {
      const optionEl = listboxRef.current.children[focusedIndex] as HTMLElement
      if (optionEl) {
        const listbox = listboxRef.current
        const optionTop = optionEl.offsetTop
        const optionBottom = optionTop + optionEl.offsetHeight
        const listboxTop = listbox.scrollTop
        const listboxBottom = listboxTop + listbox.clientHeight

        if (optionTop < listboxTop) {
          listbox.scrollTop = optionTop
        } else if (optionBottom > listboxBottom) {
          listbox.scrollTop = optionBottom - listbox.clientHeight
        }
      }
    }
  }, [focusedIndex, showSuggestions])

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        label="Cari Kota / Kecamatan (Ketik min. 2 karakter)*"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowSuggestions(true)
          setFocusedIndex(-1)
        }}
        onFocus={() => {
          if (value.length >= 2) setShowSuggestions(true)
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 250)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Cari cth: Kebayoran Baru atau Bandung..."
        helperText="Pencarian otomatis untuk provinsi, kota, kecamatan, dan kode pos."
        aria-expanded={showSuggestions && searchResults.length > 0}
        aria-autocomplete="list"
        aria-controls={showSuggestions ? listboxId : undefined}
        aria-activedescendant={
          focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined
        }
        role="combobox"
      />
      {showSuggestions && searchResults.length > 0 && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full bg-brand-cream border border-neutral-200/80 shadow-2xl rounded-xl max-h-48 overflow-y-auto mt-1 font-sans text-xs outline-none divide-y divide-neutral-100"
        >
          {searchResults.map((district, index) => (
            <div
              key={district.id}
              id={`${listboxId}-opt-${index}`}
              role="option"
              aria-selected={focusedIndex === index}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(district)
              }}
              onClick={() => handleSelect(district)}
              onMouseMove={() => setFocusedIndex(index)}
              className={cn(
                'p-3 cursor-pointer transition-colors select-none text-left',
                focusedIndex === index
                  ? 'bg-brand-gold/40 text-brand-plum'
                  : 'hover:bg-brand-gold/30 text-neutral-800'
              )}
            >
              <p className="font-bold text-brand-plum">
                {district.district_name}, {district.city_name}
              </p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                {district.province_name}{' '}
                {district.postal_code ? `• ${district.postal_code}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
      <div aria-live="polite" className="sr-only">
        {showSuggestions ? `${searchResults.length} hasil ditemukan.` : ''}
      </div>
    </div>
  )
}
