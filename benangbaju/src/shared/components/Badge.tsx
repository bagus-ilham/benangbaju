import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'brand' | 'sale' | 'gold'
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  children,
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading font-bold uppercase tracking-widest text-[9px] rounded-full border border-transparent select-none transition-all duration-300',
        {
          // Variants (Modern premium aesthetic)
          'bg-neutral-100/80 text-neutral-600 backdrop-blur-sm border-neutral-200/50': variant === 'neutral',
          'bg-green-50 text-green-700 border-green-200': variant === 'success',
          'bg-yellow-50 text-yellow-700 border-yellow-200': variant === 'warning',
          'bg-red-50 text-red-700 border-red-200': variant === 'error',
          'bg-brand-black text-white shadow-md shadow-brand-black/20': variant === 'brand',
          'bg-red-600 text-white shadow-md shadow-red-600/20': variant === 'sale',
          'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-900/5': variant === 'gold',

          // Sizes
          'px-2 py-0.5': size === 'sm',
          'px-3 py-1': size === 'md',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
