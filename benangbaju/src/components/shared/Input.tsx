import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70">
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-neutral-400 flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            ref={ref}
            className={cn(
              // Input styles — THENBLANK premium minimalist design (sharp corners, thin borders, fine transitions)
              'w-full bg-white text-xs px-4 py-3 border border-neutral-200 rounded-none text-brand-black transition-colors duration-200 placeholder:text-neutral-400 focus:border-brand-black',
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon,
                'border-red-500 focus:border-red-500': error,
              },
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 text-neutral-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input'
