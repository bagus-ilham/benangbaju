'use client'

import React, { useState, useRef, useEffect, useId, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> {
  label?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      value,
      onChange,
      error,
      helperText,
      placeholder = 'Pilih salah satu...',
      id: idProp,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState<number>(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const listboxRef = useRef<HTMLDivElement>(null)

    const generatedId = useId()
    const selectId = idProp ?? generatedId
    const errorId = `${selectId}-error`
    const helperId = `${selectId}-helper`
    const listboxId = `${selectId}-listbox`

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    const selectedOption = options.find((opt) => opt.value === value)
    const selectedIndex = options.findIndex((opt) => opt.value === value)

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick)
      }

      return () => {
        document.removeEventListener('mousedown', handleOutsideClick)
      }
    }, [isOpen])

    // Reset focused index when opened
    useEffect(() => {
      if (isOpen) {
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
      }
    }, [isOpen, selectedIndex])

    // Scroll active item into view
    useEffect(() => {
      if (isOpen && focusedIndex >= 0 && listboxRef.current) {
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
    }, [focusedIndex, isOpen])

    const handleSelect = useCallback(
      (val: string) => {
        onChange?.(val)
        setIsOpen(false)
        buttonRef.current?.focus()
      },
      [onChange]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (disabled) return

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex].value)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else {
            setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          }
          break
        case 'Escape':
          if (isOpen) {
            e.preventDefault()
            setIsOpen(false)
            buttonRef.current?.focus()
          }
          break
        case 'Tab':
          if (isOpen) {
            setIsOpen(false)
          }
          break
      }
    }

    return (
      <div className="w-full flex flex-col space-y-1" ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70 transition-colors duration-200"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Hidden native select for form integration and standard behavior */}
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom Select Trigger */}
          <button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={cn(
              // Input styles matching Input.tsx
              'w-full flex items-center justify-between bg-white text-xs px-4 py-3 border border-neutral-200 rounded-none text-left transition-all duration-300 focus-ring-premium disabled:opacity-50 disabled:cursor-not-allowed',
              {
                'border-brand-black bg-neutral-50/50': isOpen,
                'border-red-500': error,
                'text-neutral-400': !selectedOption,
                'text-brand-black': selectedOption,
              },
              className
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}

            aria-describedby={describedBy}
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <ChevronDown
              className={cn('w-4 h-4 text-neutral-400 transition-transform duration-300', {
                'rotate-180': isOpen,
              })}
              aria-hidden="true"
            />
            {/* Animated focus underline */}
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 h-[2px] bg-brand-black transform origin-left transition-transform duration-300',
                isOpen ? 'scale-x-100' : 'scale-x-0 group-focus-within:scale-x-100'
              )}
              aria-hidden="true"
            />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={listboxRef}
                id={listboxId}
                initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 shadow-lg origin-top max-h-60 overflow-y-auto outline-none"
                role="listbox"
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                aria-activedescendant={
                  focusedIndex >= 0 ? `${selectId}-opt-${focusedIndex}` : undefined
                }
              >
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-neutral-400 text-center">
                    Tidak ada opsi
                  </div>
                ) : (
                  options.map((opt, index) => {
                    const isSelected = opt.value === value
                    const isFocused = index === focusedIndex

                    return (
                      <div
                        key={opt.value}
                        id={`${selectId}-opt-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        onMouseMove={() => setFocusedIndex(index)}
                        className={cn(
                          'flex items-center justify-between px-4 py-2.5 text-xs font-sans cursor-pointer transition-colors',
                          isSelected || isFocused
                            ? 'bg-neutral-50 text-brand-black font-medium'
                            : 'text-neutral-600'
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 text-brand-black flex-shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <span id={errorId} className="text-[10px] text-red-500 tracking-wide font-sans">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-[10px] text-neutral-500 tracking-wide font-sans">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
