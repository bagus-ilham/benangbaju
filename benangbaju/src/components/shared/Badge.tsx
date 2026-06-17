import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'brand'
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading font-medium uppercase tracking-widest text-[9px] rounded-none border border-transparent select-none',
        {
          // Variants (THENBLANK muted elegant color schema)
          'bg-neutral-100 text-neutral-600': variant === 'neutral',
          'bg-emerald-50 text-emerald-800 border-emerald-100': variant === 'success',
          'bg-amber-50 text-amber-800 border-amber-100': variant === 'warning',
          'bg-rose-50 text-rose-800 border-rose-100': variant === 'error',
          'bg-brand-black text-white': variant === 'brand',
          
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
