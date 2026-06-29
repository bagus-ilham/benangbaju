'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, value, onChange, error, helperText, placeholder = 'Pilih salah satu...', id: idProp, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const generatedId = useId()
    const selectId = idProp ?? generatedId

    const selectedOption = options.find((opt) => opt.value === value)

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

    const handleSelect = (val: string) => {
      onChange?.(val)
      setIsOpen(false)
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
          {/* Hidden native select for form integration and accessibility */}
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
            <option value="" disabled>{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom Select Trigger */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
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
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <ChevronDown 
              className={cn('w-4 h-4 text-neutral-400 transition-transform duration-300', {
                'rotate-180': isOpen,
              })} 
            />
            {/* Animated focus underline */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-[2px] bg-brand-black transform origin-left transition-transform duration-300",
              isOpen ? "scale-x-100" : "scale-x-0 group-focus-within:scale-x-100"
            )} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 shadow-lg origin-top max-h-60 overflow-y-auto"
                role="listbox"
              >
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-neutral-400 text-center">
                    Tidak ada opsi
                  </div>
                ) : (
                  options.map((opt) => (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={opt.value === value}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'flex items-center justify-between px-4 py-2.5 text-xs font-sans cursor-pointer transition-colors',
                        opt.value === value
                          ? 'bg-neutral-50 text-brand-black font-medium'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-brand-black'
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {opt.value === value && (
                        <Check className="w-3.5 h-3.5 text-brand-black flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <span className="text-[10px] text-red-500 tracking-wide font-sans">
            {error}
          </span>
        )}
        
        {!error && helperText && (
          <span className="text-[10px] text-neutral-500 tracking-wide font-sans">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
