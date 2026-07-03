import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = idProp ?? generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70 transition-colors duration-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          {leftIcon && (
            <div
              className="absolute left-3 text-neutral-400 flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-black"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              // Input styles — THENBLANK premium minimalist design (sharp corners, thin borders, fine transitions)
              'w-full bg-white text-xs px-4 py-3 border border-neutral-200 rounded-none text-brand-black transition-all duration-300 placeholder:text-neutral-400 focus:border-brand-black focus:bg-neutral-50/50 focus-ring-premium',
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon,
                'border-red-500 focus:border-red-500': error,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          {/* Animated focus underline */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-black transform scale-x-0 transition-transform duration-300 origin-left group-focus-within:scale-x-100" />

          {rightIcon && (
            <div
              className="absolute right-3 text-neutral-400 flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-black"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input'
