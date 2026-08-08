'use client'

import React from 'react'
import { HandDrawnIcon } from './HandDrawnIcon'
import { cn } from '@/lib/utils'

export interface AdminSearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  containerClassName?: string
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  className,
  containerClassName,
  ...props
}: AdminSearchInputProps): React.JSX.Element {
  return (
    <div className={cn('relative flex-1', containerClassName)}>
      <HandDrawnIcon
        name="search"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 focus:border-brand-plum focus:ring-1 focus:ring-brand-plum/40 outline-none text-xs rounded-xl transition shadow-2xs font-sans text-neutral-800 placeholder:text-neutral-400',
          className
        )}
        aria-label={placeholder}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition"
          aria-label="Bersihkan pencarian"
        >
          <HandDrawnIcon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
