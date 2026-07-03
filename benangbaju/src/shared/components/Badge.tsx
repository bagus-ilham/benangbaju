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
        'inline-flex items-center font-heading font-medium uppercase tracking-widest text-[9px] rounded-none border border-transparent select-none transition-all duration-200',
        {
          // Variants (THENBLANK muted elegant color schema)
          'bg-neutral-100 text-neutral-600': variant === 'neutral',
          'bg-success-bg text-success border-success-border': variant === 'success',
          'bg-warning-bg text-warning border-warning-border': variant === 'warning',
          'bg-error-bg text-error border-error-border': variant === 'error',
          'bg-brand-black text-white': variant === 'brand',
          'bg-error text-white border-error': variant === 'sale',
          'bg-brand-gold-muted text-brand-gold border-brand-gold/30': variant === 'gold',

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
