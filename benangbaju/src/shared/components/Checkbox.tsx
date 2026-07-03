'use client'

import React, { useId } from 'react'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string
  helperText?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = idProp ?? generatedId
    const errorId = `${checkboxId}-error`
    const helperId = `${checkboxId}-helper`

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    return (
      <div className={cn('flex flex-col space-y-1', className)}>
        <label htmlFor={checkboxId} className="group relative flex items-start cursor-pointer">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className="peer sr-only"
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          <div
            className={cn(
              'relative flex items-center justify-center w-5 h-5 mt-0.5 border bg-white transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-black/20 peer-checked:bg-brand-black peer-checked:border-brand-black peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              error ? 'border-red-500' : 'border-neutral-300'
            )}
          >
            {/* Custom Check Icon */}
            <Check
              className="w-3.5 h-3.5 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
              strokeWidth={3}
            />
          </div>

          {label && (
            <span className="ml-3 text-xs text-neutral-700 font-sans group-hover:text-brand-black transition-colors peer-disabled:opacity-50">
              {label}
            </span>
          )}
        </label>

        {error && (
          <span id={errorId} className="text-[10px] text-red-500 tracking-wide font-sans mt-1">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-[10px] text-neutral-500 tracking-wide font-sans mt-1">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
