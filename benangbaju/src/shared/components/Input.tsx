'use client'

import React, { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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

    const [showPassword, setShowPassword] = useState(false)
    const isPasswordInput = type === 'password'
    const currentType = isPasswordInput ? (showPassword ? 'text' : 'password') : type

    const effectiveRightIcon =
      rightIcon ??
      (isPasswordInput ? (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-neutral-400 hover:text-brand-plum transition-colors focus:outline-none p-1"
          tabIndex={-1}
          aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ) : null)

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] uppercase tracking-wider font-sans font-bold text-brand-plum/80 transition-colors duration-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          {leftIcon && (
            <div
              className="absolute left-3 text-neutral-400 flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-plum"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={currentType}
            ref={ref}
            className={cn(
              // Input styles — Modern premium soft design with Brand Guidelines v9 tokens
              'w-full bg-brand-cream text-xs px-4 py-3.5 border border-neutral-200/80 rounded-xl text-brand-plum transition-all duration-300 placeholder:text-neutral-400 focus:bg-brand-cream focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-brand-gold/40 focus:shadow-xs font-sans',
              {
                'pl-11': leftIcon,
                'pr-11': effectiveRightIcon,
                'border-red-500 focus:border-red-500 focus:ring-red-500/10': error,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          {effectiveRightIcon && (
            <div className="absolute right-3 text-neutral-400 flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-plum">
              {effectiveRightIcon}
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
