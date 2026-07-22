'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string
  helperText?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, helperText, id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const radioId = idProp ?? generatedId
    const errorId = `${radioId}-error`
    const helperId = `${radioId}-helper`

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    return (
      <div className={cn('flex flex-col space-y-1', className)}>
        <label htmlFor={radioId} className="group relative flex items-start cursor-pointer">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className="peer sr-only"

            aria-describedby={describedBy}
            {...props}
          />

          <div
            className={cn(
              'relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-full border bg-white transition-all duration-300 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-accent/20 peer-checked:border-brand-black peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              error ? 'border-red-500' : 'border-neutral-300'
            )}
          >
            {/* Custom Radio Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-brand-black scale-0 opacity-0 transition-all duration-300 peer-checked:scale-100 peer-checked:opacity-100 ease-[0.175,0.885,0.32,1.275]" />
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

Radio.displayName = 'Radio'
