'use client'

import React, { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  error?: string
  helperText?: string
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, error, helperText, id: idProp, checked, ...props }, ref) => {
    const generatedId = useId()
    const switchId = idProp ?? generatedId

    return (
      <div className={cn('flex flex-col space-y-1', className)}>
        <label htmlFor={switchId} className="group relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            checked={checked}
            className="peer sr-only"
            role="switch"
            aria-checked={checked}
            {...props}
          />

          <div className="relative flex items-center w-9 h-5 rounded-full border border-neutral-300 bg-neutral-200 transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-black/20 peer-checked:bg-brand-black peer-checked:border-brand-black peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
            {/* Switch Thumb */}
            <motion.div
              layout
              transition={{
                type: 'spring',
                stiffness: 700,
                damping: 30,
              }}
              className="w-4 h-4 bg-white rounded-full shadow-sm ml-0.5"
              style={{
                x: checked ? 14 : 0,
              }}
            />
          </div>

          {label && (
            <span className="ml-3 text-xs text-neutral-700 font-sans group-hover:text-brand-black transition-colors peer-disabled:opacity-50">
              {label}
            </span>
          )}
        </label>

        {error && (
          <span className="text-[10px] text-red-500 tracking-wide font-sans mt-1">{error}</span>
        )}

        {!error && helperText && (
          <span className="text-[10px] text-neutral-500 tracking-wide font-sans mt-1">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Switch.displayName = 'Switch'
